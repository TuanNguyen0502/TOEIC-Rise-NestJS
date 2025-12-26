import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticService } from './statistic.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';

@ApiTags('staff/stats')
@ApiBearerAuth('JWT')
@Controller('staff/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN, ERole.STAFF)
export class StaffStatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get('system-overview')
  async systemOverview() {
    return this.statisticService.getSystemOverview();
  }
}

