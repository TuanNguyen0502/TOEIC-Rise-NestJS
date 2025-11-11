import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { UserService } from './user.service';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @GetCurrentUserEmail() email: string,
  ): Promise<ProfileResponseDto> {
    return this.userService.getUserProfileByEmail(email);
  }
}
