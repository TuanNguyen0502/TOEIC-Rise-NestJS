import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { PageResponse } from 'src/test-set/dto/page-response.dto';
import { TestHistoryResponse } from './dto/test-history-response.dto';
import { FullTestResultResponse } from './dto/full-test-result-response.dto';
import { AnalysisResultResponse } from './dto/analysis-result-response.dto';
import { EDays } from 'src/enums/EDays.enum';

@ApiTags('learner/analysis')
@ApiBearerAuth('JWT')
@Controller('learner/analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get()
  async getAnalysisResult(
    @Query('days') days: EDays = EDays.ONE_MONTH,
    @GetCurrentUserEmail() email: string,
  ): Promise<AnalysisResultResponse> {
    return this.analysisService.getAnalysisResult(email, days);
  }

  @Get('result')
  async getAllTestHistory(
    @Query('page') page: number = 0,
    @Query('size') size: number = 10,
    @GetCurrentUserEmail() email: string,
  ): Promise<PageResponse<TestHistoryResponse[]>> {
    return this.analysisService.getAllTestHistory(page, size, email);
  }

  @Get('full-test')
  async getFullTestResult(
    @Query('size') size: number = 5,
    @GetCurrentUserEmail() email: string,
  ): Promise<FullTestResultResponse> {
    return this.analysisService.getFullTestResult(email, size);
  }
}
