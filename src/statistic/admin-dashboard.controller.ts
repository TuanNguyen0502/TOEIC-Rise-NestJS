import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticService } from './statistic.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { ParseDatePipe } from 'src/common/pipes/parse-date.pipe';

@ApiTags('admin/stats')
@ApiBearerAuth('JWT')
@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN, ERole.STAFF)
export class AdminDashboardController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get('analytics')
  async analytics(@Query('from') from: Date, @Query('to') to: Date) {
    return this.statisticService.getPerformanceAnalysis(from, to);
  }
}
