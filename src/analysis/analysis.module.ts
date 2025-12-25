import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { UserTest } from 'src/entities/user-test.entity';
import { Question } from 'src/entities/question.entity';
import { AuthModule } from 'src/auth/auth.module';
import { QuestionGroupModule } from 'src/question-group/question-group.module';
import { QuestionModule } from 'src/question/question.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTest, Question]),
    AuthModule,
    QuestionGroupModule,
    QuestionModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
