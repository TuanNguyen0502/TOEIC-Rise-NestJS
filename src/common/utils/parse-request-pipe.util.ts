import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseRequestPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // 1) Nếu là string -> parse JSON
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        throw new BadRequestException(
          `Invalid JSON in field "${metadata.data ?? 'body'}"`,
        );
      }
    }
    // 2) Nếu là object (trường hợp body parser đã parse giúp)
    if (typeof value === 'object' && value !== null) {
      return value;
    }
    throw new BadRequestException(
      `Invalid payload type for "${metadata.data ?? 'body'}"`,
    );
  }
}
