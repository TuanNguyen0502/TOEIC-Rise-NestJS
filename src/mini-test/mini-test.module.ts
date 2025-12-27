import { Module } from '@nestjs/common';
import { LearnerMiniTestController } from './learner-mini-test.controller';
import { MiniTestService } from './mini-test.service';
import { TagModule } from '../tag/tag.module';
import { QuestionModule } from '../question/question.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TagModule, QuestionModule, AuthModule],
  controllers: [LearnerMiniTestController],
  providers: [MiniTestService],
})
export class MiniTestModule {}
