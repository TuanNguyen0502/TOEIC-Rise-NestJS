import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { Test } from '../entities/test.entity';
import { TestSet } from '../entities/test-set.entity';
import { Part } from '../entities/part.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { Question } from '../entities/question.entity';
import { Tag } from '../entities/tag.entity';
import { AdminTestController } from './admin-test.controller';
import { AuthModule } from 'src/auth/auth.module';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Test,
      TestSet,
      Part,
      QuestionGroup,
      Question,
      Tag,
    ]),
    AuthModule,
  ],
  controllers: [TestController, AdminTestController],
  providers: [TestService, RolesGuard],
})
export class TestModule {}
