import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CounselorService } from './counselor.service';
import { ChatDto, FeedbackDto, RegenerateDto } from './dto/chat.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { QueueService } from '../queue/queue.service';

@Controller('counselor')
export class CounselorController {
  constructor(
    private readonly counselorService: CounselorService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
  ) {}

  @Post('chat')
  @HttpCode(HttpStatus.ACCEPTED)
  async chat(
    @Request() req: any,
    @Body() dto: ChatDto,
  ): Promise<ChatResponseDto> {
    const userId = req.user.user_id;
    let conversationId = dto.conversation_id;

    if (!conversationId) {
      const session = await this.counselorService.startSession(userId, {});
      conversationId = session._id.toString();
    }

    const jobId = await this.queueService.enqueueCounselorChat(
      userId,
      conversationId,
      dto.message,
    );
    return { jobId, conversation_id: conversationId, message: 'Counselor chat started' };
  }

  @Get('conversations')
  async getConversations(@Request() req: any) {
    return this.counselorService.getSessions(req.user.user_id);
  }

  @Get('conversations/:id')
  async getHistory(@Request() req: any, @Param('id') id: string) {
    return this.counselorService.getSessionHistory(req.user.user_id, id);
  }

  @Delete('conversations/:id')
  async deleteConversation(@Request() req: any, @Param('id') id: string) {
    await this.counselorService.deleteSession(req.user.user_id, id);
    return { success: true, message: 'Conversation deleted' };
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
  @HttpCode(HttpStatus.ACCEPTED)
  async regenerate(@Request() req: any, @Body() dto: RegenerateDto) {
    const userId = req.user.user_id;
    const history = await this.counselorService.getSessionHistory(
      userId,
      dto.conversation_id,
    );

    // Find the last student message
    const studentMessages = history.filter(
      (m) => m.role === 'student' || m.role === 'user',
    );
    if (studentMessages.length === 0) {
      throw new Error(
        'No user messages found in this conversation history to regenerate',
      );
    }
    const lastStudentMsg = studentMessages[studentMessages.length - 1];

    const jobId = await this.queueService.enqueueCounselorChat(
      userId,
      dto.conversation_id,
      lastStudentMsg.content,
    );
    return { jobId, conversation_id: dto.conversation_id, message: 'Counselor regeneration started' };
  }
}
