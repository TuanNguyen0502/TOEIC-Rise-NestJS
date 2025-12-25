import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestionReportService } from './question-report.service';
import { GetQuestionReportsQueryDto } from './dto/get-question-reports-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator'; // Import decorator lấy user

@Controller('staff/question-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.STAFF, ERole.ADMIN)
export class StaffQuestionReportController {
  constructor(private readonly questionReportService: QuestionReportService) {}

  @Get()
  async getStaffQuestionReports(
    @GetCurrentUserEmail() email: string,
    @Query() query: GetQuestionReportsQueryDto,
  ) {
    return await this.questionReportService.getStaffReports(email, query);
  }

  @Get(':id')
  async getQuestionReportDetail(
    @Param('id', ParseIntPipe) id: number, // ParseIntPipe để đảm bảo id là số
    @GetCurrentUserEmail() email: string,
  ) {
    // Truyền userId vào service để check quyền
    return await this.questionReportService.getStaffReportDetail(id, email);
  }
}
