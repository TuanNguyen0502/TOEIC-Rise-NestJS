import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Question } from '../entities/question.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { Tag } from '../entities/tag.entity';
import { QuestionRequestDto } from './dto/question-request.dto';
import { QuestionResponseDto } from './dto/question-response.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuestionGroup)
    private qgRepository: Repository<QuestionGroup>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  /**
   * Helper function to find or create tags from a string (e.g., "tag1;tag2")
   * This replicates the logic from TagServiceImpl.java
   */
  private async findOrCreateTags(tagsString: string): Promise<Tag[]> {
    if (!tagsString) {
      return [];
    }

    const tagNames = tagsString
      .split(';')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagNames.length === 0) {
      return [];
    }

    const existingTags = await this.tagRepository.find({
      where: { name: In(tagNames) },
    });

    const existingTagNames = existingTags.map((t) => t.name);
    const newTagNames = tagNames.filter((n) => !existingTagNames.includes(n));

    const newTags = newTagNames.map((name) =>
      this.tagRepository.create({ name }),
    );
    const savedTags = await this.tagRepository.save(newTags);

    return [...existingTags, ...savedTags];
  }

  /**
   * Corresponds to: questionService.getQuestionById(id)
   */
  async getQuestionById(id: number): Promise<QuestionResponseDto> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['tags', 'questionGroup'], // Eagerly load tags and group
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
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
      throw new NotFoundException(`Question with ID ${dto.id} not found`);
    }

    // 2. Find the question group (to ensure it exists)
    const questionGroup = await this.qgRepository.findOne({
      where: { id: dto.questionGroupId },
    });
    if (!questionGroup) {
      throw new NotFoundException(
        `QuestionGroup with ID ${dto.questionGroupId} not found`,
      );
    }

    // 3. Find or create tags
    const tags = await this.findOrCreateTags(dto.tags);

    // 4. Update the question entity
    question.questionGroup = questionGroup;
    question.content = dto.content ?? question.content;

    // Convert Map-like object { A: "text", B: "text" } to string[]
    if (dto.options) {
      // Assign to a new, non-undefined constant
      const options = dto.options;
      question.options = Object.keys(options).map(
        (key) => `${key}:${options[key]}`, // Use the new constant here
      );
    }

    question.correctOption = dto.correctOption;
    question.explanation = dto.explanation;
    question.tags = tags;

    // 5. Save the question
    await this.questionRepository.save(question);
  }
}
