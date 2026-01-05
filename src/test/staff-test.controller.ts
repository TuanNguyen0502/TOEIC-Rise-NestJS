import {
  Controller,
  Get,
  Post,
  Put,
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
import { TestUpdateRequestDto } from './dto/test-update-request.dto';
import { ParseAndValidateJsonPipe } from 'src/common/pipes/parse-and-validate-json.pipe';

@ApiTags('staff/tests')
@ApiBearerAuth('JWT') // For Swagger UI
@Controller('staff/tests')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT auth and Roles guard
@Roles(ERole.ADMIN, ERole.STAFF) // Specify that ADMIN and STAFF can access
export class StaffTestController {
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
    @Body() body: { testRequest?: string },
  ) {
    // Parse and validate testRequest from form-data
    // When using FileInterceptor with form-data, text fields come as strings
    const parsePipe = new ParseAndValidateJsonPipe(TestRequestDto);
    const testRequest = parsePipe.transform(body.testRequest, {
      data: 'testRequest',
      type: 'body',
      metatype: TestRequestDto,
    });
    await this.testService.importTest(file, testRequest);
    return { message: 'Test imported' };
  }

  @Put(':id')
  async updateTest(
    @Param('id', ParseIntPipe) id: number,
    @Body() testUpdateRequest: TestUpdateRequestDto,
  ) {
    return this.testService.updateTest(id, testUpdateRequest);
  }
}
