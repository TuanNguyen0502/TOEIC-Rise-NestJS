import { HttpStatus } from '@nestjs/common';

export const ErrorCode = {
  // === 1. Authentication & Authorization ===
  UNAUTHENTICATED: {
    message: 'Unauthenticated',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  UNAUTHORIZED: {
    message: 'You do not have permission',
    httpStatus: HttpStatus.FORBIDDEN,
  },
  INVALID_CREDENTIALS: {
    message: 'Email or password is incorrect',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  ACCOUNT_LOCKED: {
    message: 'Your account is locked',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  UNVERIFIED_ACCOUNT: {
    message: 'Account is not verified',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  VERIFIED_ACCOUNT: {
    message: 'Account is already verified',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  OTP_NOT_VERIFIED: {
    message: 'OTP has not been verified',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  DUPLICATE_EMAIL: {
    message: 'Email already exists',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  TOKEN_EXPIRED: {
    message: 'Token has expired',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  TOKEN_INVALID: {
    message: 'Token is invalid',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },

  // === 2. Validation Errors ===
  VALIDATION_ERROR: {
    message: 'Invalid input value.',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  PASSWORD_MISMATCH: {
    message: 'Passwords do not match',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  INVALID_OTP: {
    message: '%s OTP is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  OTP_EXPIRED: {
    message: 'OTP has expired',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // === 3. Business Logic Errors ===
  OTP_LIMIT_EXCEEDED: {
    message: 'Exceeded %s OTP limit. Please try again after 30 minutes.',
    httpStatus: HttpStatus.TOO_MANY_REQUESTS,
  },
  REGISTRATION_EXPIRED: {
    message: 'Registration session has expired. Please register again.',
    httpStatus: HttpStatus.GONE,
  },
  SYSTEM_PROMPT_CANNOT_DEACTIVATE: {
    message: 'Cannot deactivate the only active system prompt.',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // === 4. Resource / Data Not Found or Conflicts ===
  RESOURCE_NOT_FOUND: {
    message: '%s not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  RESOURCE_ALREADY_EXISTS: {
    message: '%s already exists',
    httpStatus: HttpStatus.CONFLICT,
  },
  INVALID_REQUEST: {
    message: 'Invalid request, %s',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // === 5. External Services / Upload Errors ===
  UPLOAD_FAILED: {
    message: 'Failed to upload file',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
  FILE_DELETE_FAILED: {
    message: 'Failed to delete file',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
  INVALID_FILE_FORMAT: {
    message: 'The file format you sent is invalid',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
  MAIL_SEND_FAILED: {
    message: 'Failed to send email',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
  },
  IMAGE_SIZE_EXCEEDED: {
    message: 'Image size exceeds the limit',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
  FILE_SIZE_EXCEEDED: {
    message: 'File size exceeds the limit',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
  FILE_READ_ERROR: {
    message: 'Can not read file',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
  OTP_SEND_FAILED: {
    message: 'Failed to send OTP',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
  },
  JSON_CONVERT_ERROR: {
    message: 'Error converting JSON',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  IMAGE_PROCESSING_ERROR: {
    message: 'Error processing image',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // === 9. System & Uncategorized ===
  DATABASE_ERROR: {
    message: 'Database error',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
  GENERATE_TOKEN_EXCEPTION: {
    message: 'Failed to generate token',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
  UNCATEGORIZED_EXCEPTION: {
    message: 'Unexpected error occurred',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
  CACHE_ERROR: {
    message: 'Cache error',
    httpStatus: HttpStatus.NOT_IMPLEMENTED,
  },
} as const;

export type ErrorCodeKey = keyof typeof ErrorCode;
export type ErrorCodeValue = (typeof ErrorCode)[ErrorCodeKey];
