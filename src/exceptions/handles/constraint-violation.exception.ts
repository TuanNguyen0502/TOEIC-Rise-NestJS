import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { AppException } from '../app.exception';

export class ConstraintViolationException extends AppException {
  constructor(message?: string | object) {
    super(
      ErrorCode.VALIDATION_ERROR,
      message ?? ErrorCode.VALIDATION_ERROR.message,
    );
  }
}
