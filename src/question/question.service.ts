import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { Tag } from '../entities/tag.entity';
import { Test } from '../entities/test.entity';
import { QuestionRequestDto } from './dto/question-request.dto';
import { QuestionResponseDto } from './dto/question-response.dto';
import { QuestionExcelRequestDto } from 'src/test/dto/question-excel-request.dto';
import { QuestionMapper } from './mapper/question.mapper';
import { QuestionGroupService } from 'src/question-group/question-group.service';
import { TagService } from 'src/tag/tag.service';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { ETestStatus } from 'src/enums/ETestStatus.enum';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    private readonly questionGroupService: QuestionGroupService,
    private readonly tagService: TagService,
    private readonly questionMapper: QuestionMapper,
  ) {}
  /**
   * Corresponds to: questionService.getQuestionById(id)
   */
  async getQuestionById(id: number): Promise<QuestionResponseDto> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['tags', 'questionGroup'], // Eagerly load tags and group
    });

    if (!question) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');
    }

    // Map to the DTO
    return {
      id: question.id,
      position: question.position,
      content: question.content,
      options: question.options,
      correctOption: question.correctOption,
      explanation: question.explanation,
      tags: question.tags.map((tag) => tag.name),
    };
  }

  /**
   * Corresponds to: questionService.updateQuestion(questionRequest)
   */
  async updateQuestion(dto: QuestionRequestDto): Promise<void> {
    // 1. Find the question
    const question = await this.questionRepository.findOne({
      where: { id: dto.id },
      relations: ['questionGroup', 'questionGroup.test'],
    });
    if (!question) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');
    }

    await this.updateQuestionWithEntity(question, dto);
  }

  async updateQuestionWithEntity(
    question: Question,
    dto: QuestionRequestDto,
  ): Promise<void> {
    // Parse tags (create if not exists)
    const tags = await this.tagService.parseTagsAllowCreate(dto.tags);

    // 4. Update the question entity
    question.content = dto.content ?? question.content;
    question.correctOption = dto.correctOption;
    question.explanation = dto.explanation;
    question.tags = tags;

    // Convert Map-like object { A: "text", B: "text" } to string[]
    if (dto.options) {
      question.options = dto.options;
    }

    // Save the question
    await this.questionRepository.save(question);

    // Change test status to PENDING
    await this.changeTestStatus(question);
  }

  /**
   * Corresponds to: changeTestStatus(question) - @Async method in Java
   * Change test status to PENDING if not already PENDING
   */
  private async changeTestStatus(question: Question): Promise<void> {
    // Load question with questionGroup and test relations if not already loaded
    let questionWithRelations: Question = question;
    if (!question.questionGroup || !question.questionGroup.test) {
      const found = await this.questionRepository.findOne({
        where: { id: question.id },
        relations: ['questionGroup', 'questionGroup.test'],
      });
      if (!found)
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');
      questionWithRelations = found;
    }

    if (!questionWithRelations?.questionGroup?.test) {
      return;
    }

    const test = questionWithRelations.questionGroup.test;
    if (test.status !== ETestStatus.PENDING) {
      test.status = ETestStatus.PENDING;
      await this.testRepository.save(test);
    }
  }

  async createQuestion(
    request: QuestionExcelRequestDto,
    questionGroup: QuestionGroup,
    tags: Tag[],
  ): Promise<Question> {
    // Map từ DTO + QuestionGroup sang entity Question
    const question = this.questionMapper.toEntity(request, questionGroup);

    // Gán tags nếu có
    if (tags && tags.length > 0) {
      question.tags = [...tags];
    }

    // TypeORM sẽ tự insert/update + bảng join ManyToMany
    return await this.questionRepository.save(question);
  }

  async getQuestionEntitiesByIds(questionIds: number[]): Promise<Question[]> {
    if (!questionIds?.length) {
      return [];
    }

    return this.questionRepository.find({
      where: { id: In(questionIds) },
      relations: ['questionGroup', 'questionGroup.part'],
    });
  }

  async getQuestionEntitiesByIdsWithPart(
    questionIds: number[],
  ): Promise<Question[]> {
    if (!questionIds || questionIds.length === 0) {
      return [];
    }

    const questions = await this.questionRepository.find({
      where: {
        id: In(questionIds),
      },
      relations: ['questionGroup', 'questionGroup.part'],
    });

    if (questions.length !== questionIds.length) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');
    }

    return questions;
  }

  async findAllQuestionByIdWithTags(
    questionIds: Set<number>,
  ): Promise<Question[]> {
    if (!questionIds || questionIds.size === 0) {
      return [];
    }

    return this.questionRepository.find({
      where: {
        id: In([...questionIds]),
      },
      relations: ['tags'],
    });
  }
}
