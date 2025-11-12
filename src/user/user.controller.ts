import {
  Controller,
  Body,
  Get,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { UserService } from './user.service';
import { AuthService } from 'src/auth/auth.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ProfileUpdateDto } from './dto/profile-update.dto';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @GetCurrentUserEmail() email: string,
  ): Promise<ProfileResponseDto> {
    return this.userService.getUserProfileByEmail(email);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @GetCurrentUserEmail() email: string,
  ) {
    const message = await this.authService.changePassword(dto, email);
    return { message };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Body() dto: ProfileUpdateDto,
    @UploadedFile() avatar: Express.Multer.File,
    @GetCurrentUserEmail() email: string,
  ) {
    await this.userService.updateUserProfile(email, dto, avatar);
    return { message: 'Profile updated successfully' };
  }
}
