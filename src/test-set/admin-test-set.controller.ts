import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TestSetService } from './test-set.service';
import { UpdateTestSetRequestDto } from './dto/update-test-set-request.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { CreateTestSetRequestDto } from './dto/create-test-set-request.dto';
import { GetTestSetsAdminDto } from './dto/get-test-sets-admin.dto';
import { GetTestSetDetailQueryDto } from './dto/get-test-set-detail-query.dto';

@ApiTags('admin/test-sets')
@ApiBearerAuth('JWT')
@Controller('admin/test-sets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN)
export class AdminTestSetController {
  constructor(private readonly testSetService: TestSetService) {}

  @Get()
  async getAllTestSets(@Query() query: GetTestSetsAdminDto) {
    return this.testSetService.getAllTestSetsAdmin(query);
  }

  @Get(':id')
  async getTestSetDetailById(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetTestSetDetailQueryDto,
  ) {
    return this.testSetService.getTestSetDetailById(id, query);
}

  @Post()
  async createTestSet(@Body() createTestSetRequest: CreateTestSetRequestDto) {
    await this.testSetService.createTestSet(createTestSetRequest);
    return {
      message: 'Test set created successfully',
    };
  }

  @Put()
  async updateTestSet(@Body() updateTestSetRequest: UpdateTestSetRequestDto) {
    return this.testSetService.updateTestSet(updateTestSetRequest);
  }

  @Delete(':id')
  async deleteTestSetById(@Param('id', ParseIntPipe) id: number) {
    await this.testSetService.deleteTestSetById(id);
    return {
      message: 'Test set deleted successfully',
    };
  }
}
