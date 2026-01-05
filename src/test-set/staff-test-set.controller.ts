import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TestSetService } from './test-set.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { GetTestSetsAdminDto } from './dto/get-test-sets-admin.dto';

@ApiTags('admin/test-sets')
@ApiBearerAuth('JWT')
@Controller('admin/test-sets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN, ERole.STAFF)
export class StaffTestSetController {
  constructor(private readonly testSetService: TestSetService) {}

  @Get()
  async getAllTestSets(@Query() query: GetTestSetsAdminDto) {
    return this.testSetService.getAllTestSetsAdmin(query);
  }
}
