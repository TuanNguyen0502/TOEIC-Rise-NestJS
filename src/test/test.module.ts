import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestService } from './test.service';
import { Test } from '../entities/test.entity';
import { TestSet } from '../entities/test-set.entity';
import { Part } from '../entities/part.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { Question } from '../entities/question.entity';
import { Tag } from '../entities/tag.entity';
import { AdminTestController } from './admin-test.controller';
import { StaffTestController } from './staff-test.controller';
import { AuthModule } from 'src/auth/auth.module';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PartModule } from 'src/part/part.module';
import { TestSetModule } from 'src/test-set/test-set.module';
import { TagModule } from 'src/tag/tag.module';
import { QuestionGroupModule } from 'src/question-group/question-group.module';
import { QuestionModule } from 'src/question/question.module';
import { TestExcelMapper } from './mapper/test.mapper';
import { TestController } from './test.controller';
import { UserTestModule } from 'src/user-test/user-test.module';

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
    UserTestModule,
    PartModule,
    TestSetModule,
    TagModule,
    QuestionGroupModule,
    QuestionModule,
    PartModule,
    forwardRef(() => TestSetModule),
  ],
  controllers: [TestController, StaffTestController, AdminTestController],
  providers: [TestService, RolesGuard, TestExcelMapper],
  exports: [TestService],
})
export class TestModule {}
