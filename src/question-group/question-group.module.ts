import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { QuestionGroupService } from './question-group.service';
import { QuestionGroupMapper } from './mapper/question-group.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionGroup])],
  providers: [QuestionGroupService, QuestionGroupMapper],
  exports: [QuestionGroupService], // allow other modules to use it
})
export class QuestionGroupModule {}
