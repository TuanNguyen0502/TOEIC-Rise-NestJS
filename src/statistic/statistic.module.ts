import { Module } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { TestSetModule } from 'src/test-set/test-set.module';
import { TestModule } from 'src/test/test.module';
import { UserTestModule } from 'src/user-test/user-test.module';
import { ChatbotModule } from 'src/chatbot/chatbot.module';
import { QuestionReportModule } from 'src/question-report/question-report.module';
import { FlashcardModule } from 'src/flashcard/flashcard.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    TestSetModule,
    TestModule,
    UserTestModule,
    ChatbotModule,
    QuestionReportModule,
    FlashcardModule,
  ],
  controllers: [AdminDashboardController],
  providers: [StatisticService],
  exports: [StatisticService],
})
export class StatisticModule {}
