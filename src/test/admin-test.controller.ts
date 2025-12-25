import {
  Controller,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TestService } from './test.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { ETestStatus } from 'src/enums/ETestStatus.enum';

@ApiTags('admin/tests')
@ApiBearerAuth('JWT') // For Swagger UI
@Controller('admin/tests')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT auth and Roles guard
@Roles(ERole.ADMIN) // Specify that ONLY ADMIN can access
export class AdminTestController {
  constructor(private readonly testService: TestService) {}

  @Patch(':id')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status', new ParseEnumPipe(ETestStatus)) status: ETestStatus,
  ): Promise<{ success: boolean }> {
    const result = await this.testService.changeTestStatusById(id, status);
    return { success: result };
  }
}
