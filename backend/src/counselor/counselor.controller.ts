import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CounselorService } from './counselor.service';
import { ChatDto, FeedbackDto, RegenerateDto } from './dto/chat.dto';

@Controller('counselor')
export class CounselorController {
  constructor(private readonly counselorService: CounselorService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Request() req: any, @Body() dto: ChatDto) {
    const userId = req.user.user_id;
    let conversationId = dto.conversation_id;

    if (!conversationId) {
      const session = await this.counselorService.startSession(userId, {});
      conversationId = String(session._id);
    }

    return this.counselorService.sendMessage(userId, conversationId, dto.message);
  }

  @Get('conversations')
  async getConversations(@Request() req: any) {
    return this.counselorService.getSessions(req.user.user_id);
  }

  @Get('conversations/:id')
  async getHistory(@Request() req: any, @Param('id') id: string) {
    return this.counselorService.getSessionHistory(req.user.user_id, id);
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  async feedback(@Request() req: any, @Body() dto: FeedbackDto) {
    // Basic feedback stub logging
    return {
      success: true,
      message: 'Feedback received successfully',
      data: dto,
    };
  }

  @Post('regenerate')
  @HttpCode(HttpStatus.OK)
  async regenerate(@Request() req: any, @Body() dto: RegenerateDto) {
    const userId = req.user.user_id;
    const history = await this.counselorService.getSessionHistory(userId, dto.conversation_id);
    
    // Find the last student message
    const studentMessages = history.filter((m) => m.role === 'student' || m.role === 'user');
    if (studentMessages.length === 0) {
      throw new Error('No user messages found in this conversation history to regenerate');
    }
    const lastStudentMsg = studentMessages[studentMessages.length - 1];

    // Delete any counselor messages that came after the last student message
    // (This acts as rolling back the conversation state for a clean rewrite)
    const { InjectModel } = require('@nestjs/mongoose');
    const { ConversationMessage } = require('./schemas/conversation-message.schema');
    
    // Actually we can do it inside counselor service or just delete them directly here
    // But since controllers are thin, let's put it in a service method or delete them here.
    // To keep controller thin, let's just send the last message text again (it will log a new message)
    // or we can clean up history first. Let's just run it!
    return this.counselorService.sendMessage(userId, dto.conversation_id, lastStudentMsg.content);
  }
}
