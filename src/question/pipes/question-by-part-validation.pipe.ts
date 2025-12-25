import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { QuestionRequestDto } from '../dto/question-request.dto';
import { QuestionGroupService } from 'src/question-group/question-group.service';

/**
 * Custom pipe to validate QuestionRequestDto based on part requirements
 * Corresponds to QuestionByPartValidation in Java
 * This pipe is needed because class-validator doesn't support dependency injection
 */
@Injectable()
export class QuestionByPartValidationPipe implements PipeTransform {
  constructor(
    private readonly questionGroupService: QuestionGroupService,
  ) {}

  async transform(
    value: QuestionRequestDto,
    metadata: ArgumentMetadata,
  ): Promise<QuestionRequestDto> {
    if (metadata.type !== 'body') {
      return value;
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    // Get question group
    const questionGroup = await this.questionGroupService.getQuestionGroup(
      value.questionGroupId,
    );

    if (!questionGroup) {
      throw new BadRequestException({
        question: 'Question group not found',
      });
    }

    const partId = questionGroup.part?.id;
    if (!partId) {
      throw new BadRequestException({
        question: 'Question group part not found',
      });
    }

    const errors: Record<string, string> = {};

    // Validate based on part ID
    // Corresponds to switch statement in Java QuestionByPartValidation
    switch (partId) {
      case 3:
      case 4:
      case 5:
      case 7:
        // Content and options are required
        if (!value.content || value.content.trim().length === 0) {
          errors.question = `Content is required for Part ${partId}`;
        }
        if (!value.options || value.options.length === 0) {
          errors.option = `Options are required for Part ${partId}`;
        }
        break;
      case 6:
        // Only options are required (can be empty array but must be present)
        if (value.options === null || value.options === undefined) {
          errors.option = `Options are required for Part ${partId}`;
        }
        break;
      // Parts 1, 2, and others don't have special requirements
      default:
        break;
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException(errors);
    }

    return value;
  }
}

