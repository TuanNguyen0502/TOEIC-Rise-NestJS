import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { type ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

@Injectable()
export class ParseAndValidateJsonPipe<T extends object>
  implements PipeTransform
{
  constructor(private readonly dtoClass: ClassConstructor<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    const location = metadata.data ?? 'body';
    let parsedValue = value;

    if (typeof parsedValue === 'string') {
      try {
        parsedValue = JSON.parse(parsedValue);
      } catch {
        throw new BadRequestException(`Invalid JSON in field "${location}"`);
      }
    }

    if (typeof parsedValue !== 'object' || parsedValue === null) {
      throw new BadRequestException(`Invalid payload type for "${location}"`);
    }

    const dtoInstance = plainToInstance(this.dtoClass, parsedValue);
    const errors = validateSync(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return dtoInstance;
  }
}
