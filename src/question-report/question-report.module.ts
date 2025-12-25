import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { QuestionReport } from 'src/entities/question-report.entity';
import { User } from 'src/entities/user.entity';
import { QuestionReportService } from './question-report.service';
import { AdminQuestionReportController } from './admin-question-report.controller';
import { StaffQuestionReportController } from './staff-question-report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionReport, User]),
    forwardRef(() => AuthModule),
  ],
  controllers: [AdminQuestionReportController, StaffQuestionReportController],
  providers: [QuestionReportService],
  exports: [QuestionReportService],
})
export class QuestionReportModule {}
