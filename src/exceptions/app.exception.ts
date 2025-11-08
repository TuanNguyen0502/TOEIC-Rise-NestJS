import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ErrorCode,
  ErrorCodeKey,
  ErrorCodeValue,
} from 'src/enums/ErrorCode.enum';

export class AppException extends HttpException {
  readonly errorCode: ErrorCodeValue;
  readonly errorCodeKey: ErrorCodeKey;
  readonly httpStatus: HttpStatus;

  constructor(errorCode: ErrorCodeValue, ...args: unknown[]) {
    const formattedMessage = args.length
      ? AppException.formatMessage(errorCode.message, ...args)
      : errorCode.message;

    // Find the key from ErrorCode object
    const errorCodeKey = AppException.getErrorCodeKey(errorCode);

    super(formattedMessage, errorCode.httpStatus);

    this.errorCode = errorCode;
    this.errorCodeKey = errorCodeKey;
    this.httpStatus = errorCode.httpStatus;
  }

  private static getErrorCodeKey(errorCodeValue: ErrorCodeValue): ErrorCodeKey {
    const entries = Object.entries(ErrorCode) as [
      ErrorCodeKey,
      ErrorCodeValue,
    ][];
    const found = entries.find(([, value]) => value === errorCodeValue);
    return found ? found[0] : ('UNCATEGORIZED_EXCEPTION' as ErrorCodeKey);
  }

  private static formatMessage(message: string, ...args: unknown[]): string {
    let result = message;
    args.forEach((arg) => {
      result = result.replace('%s', String(arg));
    });
    return result;
  }
}
