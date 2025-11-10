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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // ... (Code login của bạn)
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  // ... (Các route khác)
}
