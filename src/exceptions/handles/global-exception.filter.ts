import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ExceptionResponse } from 'src/common/bases/exception-response.dto';
import { AppException } from 'src/exceptions/app.exception';
import {
  ErrorCode,
  ErrorCodeKey,
  ErrorCodeValue,
} from 'src/enums/ErrorCode.enum';
import {
  TIMEZONE_VIETNAM,
  DATE_TIME_PATTERN,
} from 'src/common/constants/constants';
import { formatInTimeZone } from 'date-fns-tz';

// Type definitions for validation errors
interface ValidationErrorItem {
  property: string;
  constraints?: Record<string, string>;
  message?: string;
}

interface HttpExceptionResponse {
  message?: string | string[] | ValidationErrorItem[];
  statusCode?: number;
  error?: string;
}

interface ErrorWithMessage {
  message?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let errorKey: ErrorCodeKey = 'UNCATEGORIZED_EXCEPTION';
    let errorValue: ErrorCodeValue = ErrorCode.UNCATEGORIZED_EXCEPTION;
    let payloadMessage: unknown = ErrorCode.UNCATEGORIZED_EXCEPTION.message;
    let httpStatus: number = errorValue.httpStatus;

    // Handle AppException
    if (exception instanceof AppException) {
      errorKey = exception.errorCodeKey;
      errorValue = exception.errorCode;
      // Get message from HttpException's getResponse() method
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        payloadMessage = exceptionResponse;
      } else {
        const responseObj = exceptionResponse as ErrorWithMessage;
        payloadMessage = responseObj.message ?? errorValue.message;
      }
      httpStatus = errorValue.httpStatus;
    }
    // Handle AccessDeniedException (from @nestjs/common or custom)
    else if (
      exception instanceof HttpException &&
      exception.getStatus() === 403 // HttpStatus.FORBIDDEN = 403
    ) {
      errorKey = 'UNAUTHORIZED';
      errorValue = ErrorCode.UNAUTHORIZED;
      payloadMessage = errorValue.message;
      httpStatus = errorValue.httpStatus;
    }
    // Handle PayloadTooLargeException (File upload size exceeded)
    else if (exception instanceof PayloadTooLargeException) {
      errorKey = 'FILE_SIZE_EXCEEDED';
      errorValue = ErrorCode.FILE_SIZE_EXCEEDED;
      payloadMessage = ErrorCode.FILE_SIZE_EXCEEDED.message;
      httpStatus = errorValue.httpStatus;
    }
    // Handle BadRequestException (Validation errors)
    else if (exception instanceof BadRequestException) {
      const er = exception.getResponse();
      let messageObj: string | Record<string, string> =
        ErrorCode.VALIDATION_ERROR.message;

      if (er && typeof er === 'object' && 'message' in er) {
        const responseObj = er as HttpExceptionResponse;
        const m = responseObj.message;

        if (Array.isArray(m)) {
          const map: Record<string, string> = {};
          for (const item of m) {
            if (typeof item === 'object' && item !== null) {
              // Check if it's a ValidationErrorItem
              if ('property' in item) {
                const validationItem = item;
                const constraints = validationItem.constraints;
                if (constraints) {
                  const constraintValues = Object.values(constraints);
                  const firstConstraint =
                    constraintValues.length > 0
                      ? constraintValues[0]
                      : 'Validation failed';
                  map[validationItem.property] = firstConstraint;
                } else {
                  map[validationItem.property] = 'Validation failed';
                }
              }
            } else if (typeof item === 'string') {
              // fallback extract
              const field = item.match(/^(\w+)\s/)?.[1] ?? 'error';
              if (!map[field]) map[field] = item;
            }
          }
          messageObj =
            Object.keys(map).length > 0
              ? map
              : ErrorCode.VALIDATION_ERROR.message;
        } else if (typeof m === 'string') {
          messageObj = m;
        }
      }

      errorKey = 'VALIDATION_ERROR';
      errorValue = ErrorCode.VALIDATION_ERROR;
      payloadMessage = messageObj;
      httpStatus = errorValue.httpStatus;
    }
    // Handle HttpException (generic)
    else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const base = exception.getResponse();

      // Map common HTTP status codes to ErrorCode
      // Compare as numbers to avoid enum comparison issues
      const statusCode = httpStatus;
      if (statusCode === 401) {
        // HttpStatus.UNAUTHORIZED = 401
        errorKey = 'UNAUTHENTICATED';
        errorValue = ErrorCode.UNAUTHENTICATED;
        payloadMessage = errorValue.message;
      } else if (statusCode === 403) {
        // HttpStatus.FORBIDDEN = 403
        errorKey = 'UNAUTHORIZED';
        errorValue = ErrorCode.UNAUTHORIZED;
        payloadMessage = errorValue.message;
      } else if (statusCode === 404) {
        // HttpStatus.NOT_FOUND = 404
        errorKey = 'RESOURCE_NOT_FOUND';
        errorValue = ErrorCode.RESOURCE_NOT_FOUND;
        payloadMessage = errorValue.message;
      } else {
        // For other HttpExceptions, use UNCATEGORIZED_EXCEPTION
        errorKey = 'UNCATEGORIZED_EXCEPTION';
        errorValue = ErrorCode.UNCATEGORIZED_EXCEPTION;
        if (typeof base === 'string') {
          payloadMessage = base;
        } else {
          const baseObj = base as ErrorWithMessage;
          payloadMessage = baseObj.message ?? errorValue.message;
        }
      }
    }
    // Handle generic exceptions
    else {
      errorKey = 'UNCATEGORIZED_EXCEPTION';
      errorValue = ErrorCode.UNCATEGORIZED_EXCEPTION;
      const errorWithMessage = exception as ErrorWithMessage;
      payloadMessage = errorWithMessage.message ?? errorValue.message;
      httpStatus = errorValue.httpStatus;
    }

    // Build error response
    const errorResponse = this.buildErrorResponse(
      errorKey,
      errorValue,
      request.url,
      payloadMessage,
    );

    response.status(httpStatus).json(errorResponse);
  }

  private buildErrorResponse(
    errorKey: ErrorCodeKey,
    errorValue: ErrorCodeValue,
    path: string,
    message: unknown,
  ): ExceptionResponse {
    return new ExceptionResponse({
      path,
      status: errorKey, // Use errorKey (e.g., "UNAUTHENTICATED") as status
      code: errorValue.httpStatus,
      message,
      timestamp: formatInTimeZone(
        new Date(),
        TIMEZONE_VIETNAM,
        DATE_TIME_PATTERN,
      ),
    });
  }
}
