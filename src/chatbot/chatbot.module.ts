import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ChatbotService } from './chatbot.service';
import { LearnerChatbotController } from './learner-chatbot.controller';
import { AdminChatbotRatingController } from './admin-chatbot-rating.controller';
import { ChatMessage } from 'src/entities/chat-message.entity';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { ChatbotRating } from 'src/entities/chatbot-rating.entity';
import { ChatTitle } from 'src/entities/chat-title.entity';
import { User } from 'src/entities/user.entity';
import { ChatbotRatingService } from './services/chatbot-rating.service';
import { ChatMemoryService } from './services/chat-memory.service';

@Module({
  imports: [
    // Đăng ký các Entity cần dùng trong Service
    TypeOrmModule.forFeature([
      ChatMessage,
      UserAnswer,
      ChatbotRating,
      ChatTitle,
      User,
    ]),
    ConfigModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [LearnerChatbotController, AdminChatbotRatingController],
  providers: [ChatbotService, ChatbotRatingService, ChatMemoryService],
  exports: [ChatbotRatingService, ChatMemoryService],
})
export class ChatbotModule {}
