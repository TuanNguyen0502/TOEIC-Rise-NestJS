import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { QuestionGroupService } from './question-group.service';
import { QuestionGroupMapper } from './mapper/question-group.mapper';
import { AdminQuestionGroupController } from './admin-question-group.controller';
import { AuthModule } from 'src/auth/auth.module';
import { Test } from 'src/entities/test.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionGroup, Test]),
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [AdminQuestionGroupController],
  providers: [QuestionGroupService, QuestionGroupMapper],
  exports: [QuestionGroupService], // allow other modules to use it
})
export class QuestionGroupModule {}
