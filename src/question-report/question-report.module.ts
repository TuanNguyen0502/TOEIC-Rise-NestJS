import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { QuestionReport } from 'src/entities/question-report.entity';
import { User } from 'src/entities/user.entity';
import { QuestionReportService } from './question-report.service';
import { AdminQuestionReportController } from './admin-question-report.controller';
import { StaffQuestionReportController } from './staff-question-report.controller';
import { QuestionModule } from 'src/question/question.module';
import { QuestionGroupModule } from 'src/question-group/question-group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionReport, User]),
    forwardRef(() => AuthModule),
    QuestionGroupModule,
    QuestionModule,
  ],
  controllers: [AdminQuestionReportController, StaffQuestionReportController],
  providers: [QuestionReportService],
  exports: [QuestionReportService],
})
export class QuestionReportModule {}
