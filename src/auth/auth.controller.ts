import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { BlacklistService } from './blacklist/blacklist.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly blacklistService: BlacklistService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResponse = await this.authService.login(loginDto);

    // Create refresh token
    const refreshToken = await this.authService.createRefreshToken(
      loginDto.email,
    );
    const refreshTokenExpirationTime =
      this.authService.getRefreshTokenDurationMs();

    // Set refresh token as HttpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production', // Only use HTTPS in production
      path: '/',
      maxAge: refreshTokenExpirationTime,
      sameSite: 'lax',
    });

    return loginResponse;
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() registerDto: RegisterDto) {
    const message = await this.authService.register(registerDto);
    return { message };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyUser(@Body() verifyDto: VerifyUserDto) {
    const message = await this.authService.verifyUser(verifyDto);
    return { message };
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Body() resendOtpDto: ResendOtpDto) {
    const message = await this.authService.resendVerificationCode(
      resendOtpDto.email,
    );
    return { message };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const message = await this.authService.forgotPassword(forgotPasswordDto);
    return { message };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetDto: ResetPasswordDto,
    @Headers('authorization') authorization: string,
  ) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AppException(ErrorCode.TOKEN_INVALID);
    }
    const token = authorization.substring(7);
    const message = await this.authService.resetPassword(resetDto, token);
    return { message };
  }

  @Get('login/google')
  @UseGuards(GoogleAuthGuard)
  async loginWithGoogle() {
    // This endpoint initiates the Google OAuth flow
    // The guard will redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    interface GoogleUser {
      email: string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
      picture?: string;
    }
    const user = req.user as GoogleUser;
    const frontendCallbackUrl = this.configService.get<string>(
      'FRONTEND_CALLBACK_URL',
      'http://localhost:5173',
    );

    try {
      // Extract user info from Google profile
      const email = user.email;
      const fullName =
        user.fullName ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        email;
      const picture = user.picture;

      // Login or register with Google
      const loginResponse = await this.authService.loginWithGoogle(
        email,
        fullName,
        picture,
      );

      // Create refresh token
      const refreshToken = await this.authService.createRefreshToken(email);
      const refreshTokenExpirationTime =
        this.authService.getRefreshTokenDurationMs();

      // Set refresh token as HttpOnly cookie
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: false, // Set to false for localhost development
        path: '/',
        maxAge: refreshTokenExpirationTime,
        sameSite: 'lax',
      });

      // Redirect to frontend with token and user data
      const userData = JSON.stringify(loginResponse);
      const redirectUrl = `${frontendCallbackUrl}?google_success=true&access_token=${encodeURIComponent(loginResponse.accessToken)}&user_data=${encodeURIComponent(userData)}`;

      res.redirect(redirectUrl);
    } catch (error: any) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Authentication failed';
      const redirectUrl = `${frontendCallbackUrl}?google_error=${encodeURIComponent(errorMessage)}`;
      res.redirect(redirectUrl);
    }
  }

  @Get('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string | undefined>;
    const refreshToken = cookies['refresh_token'];
    if (!refreshToken) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    try {
      // Get refresh token response
      const refreshTokenResponse = await this.authService.refreshToken(
        refreshToken,
      );

      // Create new refresh token from old refresh token
      const newRefreshToken =
        await this.authService.createRefreshTokenWithRefreshToken(
          refreshToken,
        );
      const refreshTokenExpirationTime =
        this.authService.getRefreshTokenDurationMs();

      // Set new refresh token as HttpOnly cookie
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        path: '/',
        maxAge: refreshTokenExpirationTime,
        sameSite: 'lax',
      });

      return refreshTokenResponse;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(ErrorCode.TOKEN_EXPIRED);
    }
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Add token to blacklist
      await this.blacklistService.blacklistToken(token);
    }

    // Clear refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });

    return { message: 'Logout successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@GetCurrentUserEmail() email: string) {
    if (!email || email === 'anonymousUser') {
      throw new AppException(
        ErrorCode.UNAUTHORIZED,
        'Invalid or anonymous user',
      );
    }
    return this.authService.getCurrentUser(email);
  }
}
