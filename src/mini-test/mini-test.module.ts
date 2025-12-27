import { Module } from '@nestjs/common';
import { LearnerMiniTestController } from './learner-mini-test.controller';
import { TagModule } from '../tag/tag.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TagModule, AuthModule],
  controllers: [LearnerMiniTestController],
})
export class MiniTestModule {}
