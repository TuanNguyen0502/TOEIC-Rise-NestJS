import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QuestionReportService } from './question-report.service';
import { GetQuestionReportsQueryDto } from './dto/get-question-reports-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';

@Controller('admin/question-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN)
export class AdminQuestionReportController {
  constructor(private readonly questionReportService: QuestionReportService) {}

  @Get()
  async getAllQuestionReports(@Query() query: GetQuestionReportsQueryDto) {
    return await this.questionReportService.getAllReports(query);
  }
}
