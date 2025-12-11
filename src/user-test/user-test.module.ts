import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTest } from '../entities/user-test.entity';
import { UserTestService } from './user-test.service';
import { UserTestController } from './user-test.controller';
import { AuthModule } from 'src/auth/auth.module';
import { QuestionModule } from 'src/question/question.module';
import { QuestionGroupModule } from 'src/question-group/question-group.module';
import { TestModule } from 'src/test/test.module';
import { UserTestMapper } from './mapper/user-test.mapper';
import { UserModule } from 'src/user/user.module';
import { Test } from 'src/entities/test.entity';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { User } from 'src/entities/user.entity';
import { TestExcelMapper } from 'src/test/mapper/test.mapper';
import { PartMapper } from 'src/part/mapper/part.mapper';
import { QuestionGroupMapper } from 'src/question-group/mapper/question-group.mapper';
import { UserAnswerMapper } from 'src/user-answer/mapper/user-answer.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTest, Test, UserAnswer, User]),
    AuthModule,
    UserModule,
    forwardRef(() => TestModule),
    QuestionGroupModule,
    QuestionModule,
  ],
  controllers: [UserTestController],
  providers: [
    UserTestService,
    UserTestMapper,
    TestExcelMapper,
    PartMapper,
    QuestionGroupMapper,
    UserAnswerMapper,
  ],
  exports: [UserTestService],
})
export class UserTestModule {}
