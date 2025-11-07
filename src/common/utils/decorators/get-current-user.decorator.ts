import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

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
    const request = ctx.switchToHttp().getRequest();

    // This assumes your Passport strategy attaches: request.user = { email: '...' }
    const user = request.user;

    if (!user || !user.email) {
      throw new UnauthorizedException(
        'No user email found in request context.',
      );
    }

    return user.email;
  },
);
