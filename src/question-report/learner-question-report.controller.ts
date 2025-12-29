import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { QuestionReportService } from './question-report.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { QuestionReportRequestDto } from './dto/question-report-request.dto';

@Controller('learner/question-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.LEARNER)
export class LearnerQuestionReportController {
  constructor(private readonly questionReportService: QuestionReportService) {}

  @Post()
  async createReport(
    @GetCurrentUserEmail() email: string,
    @Body() dto: QuestionReportRequestDto,
  ) {
    await this.questionReportService.createReport(email, dto);
    return { message: 'Report created successfully' };
  }
}
