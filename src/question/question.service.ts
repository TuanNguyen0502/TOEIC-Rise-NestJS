import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { Tag } from '../entities/tag.entity';
import { QuestionRequestDto } from './dto/question-request.dto';
import { QuestionResponseDto } from './dto/question-response.dto';
import { QuestionExcelRequestDto } from 'src/test/dto/question-excel-request.dto';
import { QuestionMapper } from './mapper/question.mapper';
import { QuestionGroupService } from 'src/question-group/question-group.service';
import { TagService } from 'src/tag/tag.service';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
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
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question id');
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
    // 3. Find or create tags
    const tags = await this.tagService.getTagsFromString(dto.tags);

    // 4. Update the question entity
    question.content = dto.content ?? question.content;
    question.correctOption = dto.correctOption;
    question.explanation = dto.explanation;
    question.tags = tags;

    // Convert Map-like object { A: "text", B: "text" } to string[]
    if (dto.options) {
      // Assign to a new, non-undefined constant
      const options = dto.options;
      question.options = Object.keys(options).map(
        (key) => `${key}:${options[key]}`, // Use the new constant here
      );
    }

    // 5. Save the question
    await this.questionRepository.save(question);
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
}
