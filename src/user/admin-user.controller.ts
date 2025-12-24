import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Post,
  UseInterceptors,
  Body,
  UploadedFile,
  Patch,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { UserDetailResponse } from './dto/user-detail-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserCreateRequestDto } from './dto/user-create-request.dto';
import { UserUpdateRequestDto } from './dto/user-update-request.dto';

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

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  async createUser(
    @Body() dto: UserCreateRequestDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.userService.createUser(dto, file);
    return { message: 'Create user successfully' };
  }

  @Patch(':id')
  async changeUserStatus(@Param('id') id: number) {
    await this.userService.changeAccountStatus(id);
    return { message: 'Change user status successfully' };
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('avatar')) // Nhận file từ field 'avatar'
  async updateUser(
    @Param('id') id: number,
    @Body() dto: UserUpdateRequestDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.userService.updateUser(id, dto, file);
    return { message: 'Update user successfully' };
  }
}
