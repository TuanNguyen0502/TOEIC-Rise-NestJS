import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { UserDetailResponse } from './dto/user-detail-response.dto';


@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN) // Chỉ cho phép ADMIN truy cập
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(@Query() query: GetUsersQueryDto) {
    return await this.userService.getAllUsers(query);
  }

  @Get(':id')
  async getUserDetail(@Param('id') id: number): Promise<UserDetailResponse> {
    return await this.userService.getUserDetailById(id);
  }
}