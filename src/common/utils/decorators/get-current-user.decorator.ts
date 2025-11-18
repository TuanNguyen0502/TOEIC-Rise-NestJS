import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from 'src/common/bases/request-user.dto';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { AppException } from 'src/exceptions/app.exception';
/**
 * Custom decorator to extract the user email from the request object.
 * Assumes a guard (like JwtAuthGuard) has populated `req.user`.
 *
 * @example
 * @Get('profile')
 * getProfile(@GetCurrentUserEmail() email: string) {
 * return this.userService.getProfile(email);
 * }
 */
export const GetCurrentUserEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // This assumes your Passport strategy attaches: request.user = { email: '...' }
    const user = request.user as RequestUser | undefined;

    if (!user || !user.email) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Account');
    }

    return user.email;
  },
);
