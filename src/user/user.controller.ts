import { Controller, Body, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { UserService } from './user.service';
import { AuthService } from 'src/auth/auth.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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
}
