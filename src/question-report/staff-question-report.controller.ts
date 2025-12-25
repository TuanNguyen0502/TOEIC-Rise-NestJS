import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  Put,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { QuestionReportService } from './question-report.service';
import { GetQuestionReportsQueryDto } from './dto/get-question-reports-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator'; // Import decorator lấy user
import { ResolveQuestionReportDto } from './dto/resolve-question-report.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

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

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'audio', maxCount: 1 }, // Hứng file có key là "audio"
      { name: 'image', maxCount: 1 }, // Hứng file có key là "image"
    ]),
  )
  async resolveReport(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUserEmail() email: string,
    @Body() dto: ResolveQuestionReportDto,
    @UploadedFiles() files: { audio?: Express.Multer.File[]; image?: Express.Multer.File[] },
  ) {
    
    // files mặc định là object rỗng {} nếu không có file, service sẽ tự handle
    await this.questionReportService.resolveReport(id, email, dto, files || {});

    return { message: 'Resolve report successfully' };
  }
}
