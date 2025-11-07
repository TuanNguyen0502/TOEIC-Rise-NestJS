import { BadRequestException } from '@nestjs/common';

/**
 * Generates a 6-digit verification code.
 */
export function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return String(code);
}

/**
 * Extracts a group number from a string like "p1_g1".
 * @param questionGroupId The string to parse.
 * @returns The group number or null.
 */
export function extractGroupNumber(questionGroupId: string): number | null {
  if (!questionGroupId) {
    return null;
  }
  try {
    const parts = questionGroupId.split('_g');
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10);
      return isNaN(num) ? null : num;
    }
  } catch (e) {
    throw new BadRequestException('Invalid questionGroupId format');
  }
  return null;
}
