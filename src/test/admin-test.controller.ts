import {
  Controller,
  Get,
  Post,
  UploadedFile,
  Body,
  UseInterceptors,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TestService } from './test.service';
import { GetTestsAdminDto } from './dto/get-tests-admin.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { TestRequestDto } from './dto/test-request.dto';

@ApiTags('admin/tests')
@ApiBearerAuth('JWT') // For Swagger UI
@Controller('admin/tests')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT auth and Roles guard
@Roles(ERole.ADMIN) // Specify that ONLY ADMIN can access
export class AdminTestController {
  constructor(private readonly testService: TestService) {}

  @Get()
  async getAllTests(@Query() query: GetTestsAdminDto) {
    return this.testService.getAllTests(query);
  }

  @Get(':id')
  async getTestById(@Param('id', ParseIntPipe) id: number) {
    return this.testService.getAdminTestDetailById(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importTests(
    @UploadedFile() file: Express.Multer.File,
    @Body() testRequest: TestRequestDto,
  ) {
    await this.testService.importTest(file, testRequest);
    return { message: 'Test imported' };
  }
}
