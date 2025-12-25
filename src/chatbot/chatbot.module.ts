import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ChatbotService } from './chatbot.service';
import { LearnerChatbotController } from './learner-chatbot.controller';
import { ChatMessage } from 'src/entities/chat-message.entity';
import { UserAnswer } from 'src/entities/user-answer.entity';

@Module({
  imports: [
    // Đăng ký các Entity cần dùng trong Service
    TypeOrmModule.forFeature([ChatMessage, UserAnswer]),
    ConfigModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [LearnerChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
