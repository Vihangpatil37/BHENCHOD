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

    // Fetch latest recommendation to verify user completed onboarding or has recommendations
    const latestRec = dto.recommendation_id 
      ? await this.recommendationModel.findById(dto.recommendation_id).exec()
      : await this.recommendationModel.findOne({ user_id: userId }).sort({ generated_at: -1 }).exec();

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
    return this.conversationModel.find({ user_id: userId }).sort({ last_message_at: -1 }).exec();
  }

  async getSessionHistory(userId: string, sessionId: string): Promise<ConversationMessage[]> {
    const conversation = await this.conversationModel.findById(sessionId).exec();
    if (!conversation || conversation.user_id !== userId) {
      throw new NotFoundException('Conversation not found or unauthorized');
    }
    return this.messageModel.find({ conversation_id: sessionId }).sort({ created_at: 1 }).exec();
  }

  async sendMessage(userId: string, sessionId: string, messageText: string): Promise<ConversationMessage> {
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
    const aiResponse = await this.aiServiceClient.run(
      'counselor_chat',
      aiContext,
      {
        reply: '',
        recommended_links: [''],
        suggested_questions: [''],
      }
    );

    if (!aiResponse.success || !aiResponse.data) {
      throw new BadRequestException('AI Counselor failed to respond.');
    }

    let replyText = aiResponse.data.reply || JSON.stringify(aiResponse.data);
    
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

    return counselorMessage;
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
}
