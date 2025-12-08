import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { UserTest } from 'src/entities/user-test.entity';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { Question } from 'src/entities/question.entity';
import { AuthModule } from 'src/auth/auth.module';
import { QuestionGroupModule } from 'src/question-group/question-group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTest, UserAnswer, Question]),
    AuthModule,
    QuestionGroupModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
