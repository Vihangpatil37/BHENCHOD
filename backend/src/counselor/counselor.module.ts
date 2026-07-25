import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import {
  ConversationMessage,
  ConversationMessageSchema,
} from './schemas/conversation-message.schema';
import { CounselorService } from './counselor.service';
import { ContextBuilderService } from './context-builder.service';
import { CounselorController } from './counselor.controller';
import { CareersModule } from '../careers/careers.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { AIServiceModule } from '../ai-service/ai-service.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationMessage.name, schema: ConversationMessageSchema },
    ]),
    CareersModule,
    OnboardingModule,
    RecommendationModule,
    AIServiceModule,
  ],
  controllers: [CounselorController],
  providers: [CounselorService, ContextBuilderService],
  exports: [CounselorService, MongooseModule],
})
export class CounselorModule {}
