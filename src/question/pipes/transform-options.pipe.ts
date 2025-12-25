import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
} from '@nestjs/common';
import { QuestionRequestDto } from '../dto/question-request.dto';

/**
 * Pipe to transform options from object to array before validation
 * This runs before ValidationPipe to ensure options is always an array
 */
@Injectable()
export class TransformOptionsPipe implements PipeTransform {
  transform(
    value: any,
    metadata: ArgumentMetadata,
  ): QuestionRequestDto {
    if (metadata.type !== 'body' || !value || typeof value !== 'object') {
      return value;
    }

    // Transform options from object { A: "text", B: "text" } to string[] ["A:text", "B:text"]
    if (value.options && typeof value.options === 'object' && !Array.isArray(value.options)) {
      const optionsObj = value.options as Record<string, string>;
      value.options = Object.keys(optionsObj).map(
        (key) => `${key}:${optionsObj[key]}`,
      );
    }

    return value as QuestionRequestDto;
  }
}

