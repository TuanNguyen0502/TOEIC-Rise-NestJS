import { HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ExceptionResponse } from 'src/common/bases/exception-response.dto';
import {
  TIMEZONE_VIETNAM,
  DATE_TIME_PATTERN,
} from 'src/common/constants/constants';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { formatInTimeZone } from 'date-fns-tz';

export class SecurityExceptionHandler {
  static handleAuthenticationException(
    request: Request,
    response: Response,
  ): void {
    this.handleSecurityException(
      request,
      response,
      HttpStatus.UNAUTHORIZED, // 401
      ErrorCode.UNAUTHENTICATED.message,
    );
  }

  static handleAccessDeniedException(
    request: Request,
    response: Response,
  ): void {
    this.handleSecurityException(
      request,
      response,
      HttpStatus.FORBIDDEN, // 403
      ErrorCode.UNAUTHORIZED.message,
    );
  }

  private static handleSecurityException(
    request: Request,
    response: Response,
    httpStatus: HttpStatus,
    message: string,
  ): void {
    const path = request.originalUrl || request.url;

    const timestamp = formatInTimeZone(
      new Date(),
      TIMEZONE_VIETNAM,
      DATE_TIME_PATTERN,
    );

    const statusName = this.getHttpStatusName(httpStatus);

    const exceptionResponse = new ExceptionResponse({
      timestamp,
      path,
      code: httpStatus, // Equivalent to httpStatus.value() in Java
      status: statusName, // Equivalent to httpStatus.name() in Java (e.g., "UNAUTHORIZED", "FORBIDDEN")
      message,
    });
    response.status(httpStatus);
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.json(exceptionResponse);
  }

  private static getHttpStatusName(status: HttpStatus): string {
    const statusMap: Record<number, string> = {
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      400: 'BAD_REQUEST',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return statusMap[status] || 'INTERNAL_SERVER_ERROR';
  }
}
