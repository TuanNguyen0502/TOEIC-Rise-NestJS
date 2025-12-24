import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN) // Chỉ cho phép ADMIN truy cập
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(@Query() query: GetUsersQueryDto) {
    return await this.userService.getAllUsers(query);
  }
}