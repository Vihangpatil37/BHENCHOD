import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { ConversationMessage, ConversationMessageDocument } from './schemas/conversation-message.schema';
import { ContextBuilderService } from './context-builder.service';
import { StudentProfile, StudentProfileDocument } from '../onboarding/schemas/student-profile.schema';
import { Recommendation, RecommendationDocument } from '../recommendation/schemas/recommendation.schema';
import { Career, CareerDocument } from '../careers/schemas/career.schema';
import { AIServiceClient } from '../ai-service/ai-service.client';
import { StartSessionDto } from './dto/counselor.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Injectable()
export class CounselorService {
  private readonly logger = new Logger(CounselorService.name);

  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ConversationMessage.name)
    private readonly messageModel: Model<ConversationMessageDocument>,
    @InjectModel(StudentProfile.name)
    private readonly profileModel: Model<StudentProfileDocument>,
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<RecommendationDocument>,
    @InjectModel(Career.name)
    private readonly careerModel: Model<CareerDocument>,
    private readonly contextBuilder: ContextBuilderService,
    private readonly aiServiceClient: AIServiceClient,
  ) {}

  async startSession(userId: string, dto: StartSessionDto): Promise<ConversationDocument> {
    this.logger.log(`Starting counseling session for user: ${userId}`);

    // Prune expired sessions first
    await this.pruneSessions(userId);

    // Limit active conversations per user to a maximum of 2.
    // If they already have 2, keep the newest one and delete the rest.
    const existing = await this.conversationModel
      .find({ user_id: userId })
      .sort({ last_message_at: -1 })
      .exec();

    if (existing.length >= 2) {
      this.logger.log(`User ${userId} has ${existing.length} sessions. Deleting oldest to enforce limit of 2.`);
      const toDelete = existing.slice(1); // Keep the newest one (index 0), delete the rest
      for (const conv of toDelete) {
        await this.conversationModel.findByIdAndDelete(conv._id).exec();
        await this.messageModel.deleteMany({ conversation_id: String(conv._id) }).exec();
      }
    }

    // Create new conversation
    const conversation = new this.conversationModel({
      user_id: userId,
      summary: '',
    });
    await conversation.save();

    // Seed initial greeting message
    const greetingText = `Hello! I am your AI career counselor. I see you completed your onboarding and we have matched some careers for you. What would you like to discuss today?`;
    
    const message = new this.messageModel({
      conversation_id: String(conversation._id),
      role: 'counselor',
      content: greetingText,
      intent: 'general_chat',
      is_structured: false,
    });
    await message.save();

    return conversation;
  }

  async getSessions(userId: string): Promise<Conversation[]> {
    await this.pruneSessions(userId);
    return this.conversationModel.find({ user_id: userId }).sort({ last_message_at: -1 }).exec();
  }

  async getSessionHistory(userId: string, sessionId: string): Promise<ConversationMessage[]> {
    await this.pruneSessions(userId);
    const conversation = await this.conversationModel.findById(sessionId).exec();
    if (!conversation || conversation.user_id !== userId) {
      throw new NotFoundException('Conversation not found or unauthorized');
    }
    return this.messageModel.find({ conversation_id: sessionId }).sort({ created_at: 1 }).exec();
  }

  async sendMessage(userId: string, sessionId: string, messageText: string): Promise<ChatResponseDto> {
    await this.pruneSessions(userId);
    const conversation = await this.conversationModel.findById(sessionId).exec();
    if (!conversation || conversation.user_id !== userId) {
      throw new NotFoundException('Conversation not found or unauthorized');
    }

    // 1. Simple Intent Classification Step
    const intent = this.classifyIntent(messageText);

    // 2. Save user message to database
    const userMessage = new this.messageModel({
      conversation_id: sessionId,
      role: 'student',
      content: messageText,
      intent,
      is_structured: false,
    });
    await userMessage.save();

    // Update conversation last_message_at
    conversation.set('last_message_at', new Date());
    await conversation.save();

    // 3. Retrieve student profile and latest recommendations
    const profile = await this.profileModel.findOne({ user_id: userId }).exec();
    if (!profile) {
      throw new BadRequestException('Student profile not found. Please complete onboarding first.');
    }

    const latestRec = await this.recommendationModel
      .findOne({ user_id: userId })
      .sort({ generated_at: -1 })
      .exec();

    // Load actual careers for the shortlist or top recommendations
    let candidateCareersList: string[] = [];
    if (latestRec && latestRec.shortlist && latestRec.shortlist.length > 0) {
      const careerCodes = latestRec.shortlist.map((c) => c.career_code);
      const careers = await this.careerModel.find({ career_code: { $in: careerCodes } }).exec();
      candidateCareersList = careers.map(
        (c) => `- ${c.name} (Code: ${c.career_code}): ${c.description}`
      );
    } else {
      // Fallback to top seeding careers
      const careers = await this.careerModel.find().limit(20).exec();
      candidateCareersList = careers.map(
        (c) => `- ${c.name} (Code: ${c.career_code}): ${c.description}`
      );
    }

    // 4. Load recent messages for history
    const allMessages = await this.messageModel
      .find({ conversation_id: sessionId })
      .sort({ created_at: 1 })
      .exec();

    // Build chat context
    const aiContext = await this.contextBuilder.buildContext(
      conversation,
      allMessages,
      profile,
      messageText
    );
    aiContext.candidate_careers = candidateCareersList.join('\n');

    // 5. Call AI Service Client (routed to Groq/Mistral)
    let promptName = 'counselor_chat';
    let fallbackObj: any = { reply: '', recommended_links: [''], suggested_questions: [''] };

    if (intent === 'roadmap_question') {
      promptName = 'roadmap_generation';
      fallbackObj = {
        career_code: '', career_name: '', estimated_total_duration: '', overview: '',
        phases: [], salary_progression: [], higher_studies: [],
        alternative_paths: [], common_mistakes: [], final_checklist: [],
        mermaid: { nodes: [], edges: [] },
      };
    }

    const aiResponse = await this.aiServiceClient.run(
      promptName,
      aiContext,
      fallbackObj
    );

    if (!aiResponse.success || !aiResponse.data) {
      throw new BadRequestException('AI Counselor failed to respond.');
    }

    let replyText = '';

    if (intent === 'roadmap_question') {
      replyText = this.buildRoadmapReply(aiResponse.data);
    } else {
      replyText = aiResponse.data.reply || JSON.stringify(aiResponse.data);
    }
    
    // 6. Post-process AI response with safety filter
    replyText = this.applySafetyFilter(replyText);

    // Save AI counselor reply
    const counselorMessage = new this.messageModel({
      conversation_id: sessionId,
      role: 'counselor',
      content: replyText,
      intent,
      is_structured: true,
    });
    await counselorMessage.save();

    return {
      response: replyText,
      model_used: aiResponse.model,
      cached: aiResponse.cached,
      latency_ms: aiResponse.latency_ms,
    };
  }

  private buildRoadmapReply(data: any): string {
    if (!data.phases || data.phases.length === 0) {
      return "I couldn't generate a structured roadmap at this time. Please try again.";
    }

    let md = `## 🗺️ Career Roadmap: ${data.career_name || data.career_code || ''}\n\n`;

    if (data.estimated_total_duration) md += `**Total Duration:** ${data.estimated_total_duration}\n\n`;
    if (data.overview) md += `${data.overview}\n\n`;

    data.phases.forEach((phase: any, index: number) => {
      md += `### Phase ${index + 1}: ${phase.phase} (${phase.duration})\n`;
      if (phase.goal) md += `**Goal:** ${phase.goal}\n\n`;
      if (phase.milestone) md += `**Milestone:** ${phase.milestone}\n\n`;

      if (phase.action_items?.length) {
        md += `**Action Items:**\n`;
        phase.action_items.forEach((item: string) => md += `- ${item}\n`);
        md += `\n`;
      }
      if (phase.skills_to_build?.length) {
        md += `**Skills to Build:** ${phase.skills_to_build.join(', ')}\n\n`;
      }
      if (phase.entrance_exams?.length) {
        md += `**Entrance Exams:** ${phase.entrance_exams.join(', ')}\n\n`;
      }
      if (phase.certifications?.length) {
        md += `**Certifications:**\n`;
        phase.certifications.forEach((c: string) => md += `- ${c}\n`);
        md += `\n`;
      }
      if (phase.projects?.length) {
        md += `**Projects:**\n`;
        phase.projects.forEach((p: string) => md += `- ${p}\n`);
        md += `\n`;
      }
      if (phase.internships?.length) {
        md += `**Internships:**\n`;
        phase.internships.forEach((i: string) => md += `- ${i}\n`);
        md += `\n`;
      }
      if (phase.recommended_resources?.length) {
        md += `**Resources:**\n`;
        phase.recommended_resources.forEach((r: string) => md += `- ${r}\n`);
        md += `\n`;
      }
      if (phase.checkpoints?.length) {
        md += `**Checkpoints:**\n`;
        phase.checkpoints.forEach((c: string) => md += `- ${c}\n`);
        md += `\n`;
      }
      md += `---\n\n`;
    });

    if (data.salary_progression?.length) {
      md += `### 💰 Salary Progression\n\n`;
      md += `| Stage | Product Company | MNC / Service | Remote / Startup | FAANG Equivalent |\n`;
      md += `|------|----------------|--------------|-----------------|-----------------|\n`;
      data.salary_progression.forEach((s: any) => {
        const prod = s.product_company || '-';
        const mnc = s.mnc_service || '-';
        const remote = s.remote_startup || '-';
        const faang = s.faang_equivalent || '-';
        md += `| ${s.stage} | ${prod} | ${mnc} | ${remote} | ${faang} |\n`;
      });
      md += `\n`;
    }

    if (data.higher_studies?.length) {
      md += `### 🎓 Higher Studies\n\n`;
      data.higher_studies.forEach((h: string) => md += `- ${h}\n`);
      md += `\n`;
    }

    if (data.alternative_paths?.length) {
      md += `### 🔀 Alternative Career Paths\n\n`;
      data.alternative_paths.forEach((a: string) => md += `- ${a}\n`);
      md += `\n`;
    }

    if (data.common_mistakes?.length) {
      md += `### ⚠️ Common Mistakes to Avoid\n\n`;
      data.common_mistakes.forEach((m: string) => md += `- ${m}\n`);
      md += `\n`;
    }

    if (data.final_checklist?.length) {
      md += `### ✅ Final Checklist\n\n`;
      data.final_checklist.forEach((c: string) => md += `- [ ] ${c}\n`);
      md += `\n`;
    }

    const mermaidSyntax = this.buildMermaidSyntax(data.mermaid?.nodes, data.mermaid?.edges);
    if (mermaidSyntax) {
      md += `### 🧭 Roadmap Flow\n\n\`\`\`mermaid\n${mermaidSyntax}\n\`\`\`\n`;
    }

    return md;
  }

  private buildMermaidSyntax(nodes: { id: string; label: string }[] | undefined, edges: { from: string; to: string }[] | undefined): string {
    if (!nodes || nodes.length === 0) return '';
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const lines = ['graph TD'];
    for (const node of nodes) {
      lines.push(`  ${node.id}["${node.label}"]`);
    }
    for (const edge of edges || []) {
      if (nodeMap.has(edge.from) && nodeMap.has(edge.to)) {
        lines.push(`  ${edge.from} --> ${edge.to}`);
      }
    }
    return lines.join('\n');
  }

  private classifyIntent(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('roadmap') || lower.includes('step') || lower.includes('path') || lower.includes('how to')) {
      return 'roadmap_question';
    }
    if (lower.includes('career') || lower.includes('salary') || lower.includes('job') || lower.includes('work')) {
      return 'career_question';
    }
    return 'general_chat';
  }

  private applySafetyFilter(text: string): string {
    // Simple filter to catch and moderate unwanted content
    let cleanText = text;
    const blockList = ['hack', 'kill', 'suicide', 'die', 'explode', 'bomb'];
    
    for (const word of blockList) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(cleanText)) {
        this.logger.warn(`Safety filter flagged word: "${word}" in response.`);
        cleanText = cleanText.replace(regex, '***');
      }
    }
    return cleanText;
  }

  private async pruneSessions(userId: string): Promise<void> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const expiredSessions = await this.conversationModel.find({
      user_id: userId,
      last_message_at: { $lt: thirtyMinutesAgo }
    }).exec();

    if (expiredSessions.length > 0) {
      this.logger.log(`Pruning ${expiredSessions.length} expired sessions for user: ${userId}`);
      for (const session of expiredSessions) {
        await this.conversationModel.findByIdAndDelete(session._id).exec();
        await this.messageModel.deleteMany({ conversation_id: String(session._id) }).exec();
      }
    }
  }
}
