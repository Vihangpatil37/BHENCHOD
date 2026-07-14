import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { ConversationMessage } from './schemas/conversation-message.schema';
import { AIServiceClient } from '../ai-service/ai-service.client';
import { StudentProfile } from '../onboarding/schemas/student-profile.schema';

@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);

  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    private readonly aiServiceClient: AIServiceClient,
  ) {}

  async buildContext(
    conversation: ConversationDocument,
    messages: ConversationMessage[],
    profile: StudentProfile,
    latestUserMessage: string
  ): Promise<{
    student_name: string;
    student_profile_summary: string;
    candidate_careers: string;
    conversation_history: string;
    message: string;
  }> {
    this.logger.log(`Building chat context for conversation: ${conversation._id}`);

    // 1. Roll-up and summarize if history threshold is exceeded (> 10 messages)
    if (messages.length > 10) {
      this.logger.log(`Conversation messages length (${messages.length}) exceeds threshold (10). Running rolling compression...`);
      
      const messagesToSummarize = messages.slice(0, messages.length - 4);
      const remainingMessages = messages.slice(messages.length - 4);

      const textToSummarize = messagesToSummarize
        .map((m) => `${m.role === 'student' || m.role === 'user' ? 'Student' : 'Counselor'}: ${m.content}`)
        .join('\n');

      const summaryPrompt = `Existing Summary: ${conversation.summary || 'None'}\n\nNew conversation segment to append and summarize:\n${textToSummarize}\n\nProduce a brief, comprehensive running summary (under 2 paragraphs) of the student's questions, goals, and the counselor's advice so far.`;

      try {
        const summaryResponse = await this.aiServiceClient.run('report_summary', {
          text: summaryPrompt,
        });

        if (summaryResponse.success && summaryResponse.data) {
          // Extract text response (handle if it returns JSON or string)
          const newSummary = typeof summaryResponse.data === 'string' 
            ? summaryResponse.data 
            : summaryResponse.data.summary || JSON.stringify(summaryResponse.data);
          
          conversation.summary = newSummary;
          await conversation.save();
          this.logger.log(`Successfully updated rolling summary for conversation: ${conversation._id}`);
          
          // Use remaining messages for the active conversation history
          messages = remainingMessages;
        }
      } catch (err: any) {
        this.logger.error(`Failed to compress conversation history: ${err.message}. Proceeding with full history.`);
      }
    }

    // 2. Format conversation history
    let historyStr = '';
    if (conversation.summary) {
      historyStr += `[Summary of earlier conversation: ${conversation.summary}]\n\n`;
    }
    historyStr += messages
      .map((m) => `${m.role === 'student' || m.role === 'user' ? 'Student' : 'Counselor'}: ${m.content}`)
      .join('\n');

    // 3. Format candidate careers from profile's latest recommendation if available
    let candidateCareersStr = 'No recommended careers available yet. The student has not completed onboarding recommendations.';
    if (profile.current_dna) {
      // If we have DNA, we can construct or load careers.
      // Wait, we can fetch their latest recommendation from the database or construct a list.
      // In counselor service, we will fetch the latest recommendation and pass it.
    }

    // 4. Format student profile summary
    const academic = profile.academic || {};
    const c10 = (academic.class10 || {}) as any;
    const c10s = c10.subjects || {};
    const personal = profile.personal || {};
    
    const profileSummary = `
- Personal: Name: ${personal.name || 'Student'}, Age: ${personal.age || 'N/A'}, Location: ${personal.city || 'N/A'}, ${personal.state || 'N/A'}
- Academic: Class 10 Status: ${c10.status || 'N/A'}. subjects: Maths (${c10s.maths || 0}), Science (${c10s.science || 0}), Computer (${c10s.computer || 0})
- Top Interests: ${Object.entries(profile.interests || {})
      .filter(([_, val]) => val >= 70)
      .map(([key, val]) => `${key} (${val})`)
      .join(', ') || 'None'}
- Top Skills: ${Object.entries(profile.skills || {})
      .filter(([_, val]) => val >= 4)
      .map(([key, val]) => `${key} (${val}/5)`)
      .join(', ') || 'None'}
- Top Goals: ${(profile.goals || []).join(', ') || 'None'}
- Budget Tier Constraint: ${profile.constraints?.budget_tier || 'N/A'} (1-4)
- Max Study Duration: ${profile.constraints?.study_duration_max || 'N/A'} years
    `.trim();

    return {
      student_name: personal.name || 'Student',
      student_profile_summary: profileSummary,
      candidate_careers: '', // to be populated by caller (counselor service) with actual career lists
      conversation_history: historyStr,
      message: latestUserMessage,
    };
  }
}
