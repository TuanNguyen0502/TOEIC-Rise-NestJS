import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { TestSetService } from 'src/test-set/test-set.service';
import { TestService } from 'src/test/test.service';
import { UserTestService } from 'src/user-test/user-test.service';
import { ChatMemoryService } from 'src/chatbot/services/chat-memory.service';
import { QuestionReportService } from 'src/question-report/question-report.service';
import { SystemOverviewResponseDto } from './dto/system-overview-response.dto';
import { AdminDashboardResponseDto } from './dto/admin-dashboard-response.dto';
import { KpiResponseDto } from './dto/kpi-response.dto';
import { DateRangeUtil } from 'src/common/utils/date-range.util';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { ERole } from 'src/enums/ERole.enum';
import { FlashcardService } from 'src/flashcard/flashcard.service';
import { DeepInsightsResponseDto } from './dto/deep-insights-response.dto';
import { ScoreDistInsightResponseDto } from './dto/score-dist-insight-response.dto';

@Injectable()
export class StatisticService {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly testSetService: TestSetService,
    private readonly testService: TestService,
    private readonly flashcardService: FlashcardService,
    private readonly userTestService: UserTestService,
    private readonly chatMemoryService: ChatMemoryService,
    private readonly questionReportService: QuestionReportService,
  ) {}

  async getSystemOverview(): Promise<SystemOverviewResponseDto> {
    const [
      totalAccounts,
      totalLearners,
      totalStaffs,
      totalTestSets,
      totalTests,
      totalFlashcards,
      totalSubmissions,
      totalConversations,
      totalReports,
    ] = await Promise.all([
      this.userService.countAllUsers(),
      this.authService.countAllUsersWithRole(ERole.LEARNER),
      Promise.all([
        this.authService.countAllUsersWithRole(ERole.STAFF),
        this.authService.countAllUsersWithRole(ERole.ADMIN),
      ]).then(([staff, admin]) => staff + admin),
      this.testSetService.totalTestSets(),
      this.testService.totalTest(),
      this.flashcardService.totalFlashcards(),
      this.userTestService.totalUserTest(),
      this.chatMemoryService.countAllConversation(),
      this.questionReportService.totalReports(),
    ]);

    return {
      totalAccounts,
      totalLearners,
      totalStaffs,
      totalTestSets,
      totalTests,
      totalFlashcards,
      totalSubmissions,
      totalConversations,
      totalReports,
    };
  }

  async getPerformanceAnalysis(
    startDate: Date,
    endDate: Date,
  ): Promise<AdminDashboardResponseDto> {
    this.validateDateRange(startDate, endDate);

    const prevTime = DateRangeUtil.previousPeriod(startDate, endDate);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);

    const prevStart = new Date(prevTime.start);
    prevStart.setHours(0, 0, 0, 0);
    const prevEnd = new Date(prevTime.end);
    prevEnd.setDate(prevEnd.getDate() + 1);
    prevEnd.setHours(0, 0, 0, 0);

    const [newLearners, activeUsers, aiConversations, totalTests] =
      await Promise.all([
        this.getNewLearners(start, end, prevStart, prevEnd),
        this.getActiveLearners(start, end, prevStart, prevEnd),
        this.getAiConversation(start, end, prevStart, prevEnd),
        this.getTotalTest(start, end, prevStart, prevEnd),
      ]);

    const [activityTrend, deepInsights] = await Promise.all([
      this.userTestService.getActivityTrend(start, end),
      this.getDeepInsights(start, end),
    ]);

    return {
      newLearners,
      activeUsers,
      totalTests,
      aiConversations,
      activityTrend,
      deepInsights,
    };
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (!startDate || !endDate) {
      throw new AppException(ErrorCode.VALIDATION_ERROR);
    }

    if (startDate > endDate) {
      throw new AppException(ErrorCode.VALIDATION_ERROR);
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (endDate > now) {
      throw new AppException(ErrorCode.VALIDATION_ERROR);
    }
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0.0;
    }
    return ((current - previous) / previous) * 100;
  }

  private async getAiConversation(
    startDate: Date,
    endDate: Date,
    prevStart: Date,
    prevEnd: Date,
  ): Promise<KpiResponseDto> {
    const [current, prev] = await Promise.all([
      this.chatMemoryService.countTotalAiConversation(startDate, endDate),
      this.chatMemoryService.countTotalAiConversation(prevStart, prevEnd),
    ]);

    return {
      value: current,
      growthPercentage: this.calculateGrowth(current, prev),
    };
  }

  private async getTotalTest(
    startDate: Date,
    endDate: Date,
    prevStart: Date,
    prevEnd: Date,
  ): Promise<KpiResponseDto> {
    const [prev, current] = await Promise.all([
      this.userTestService.totalUserTestBetween(prevStart, prevEnd),
      this.userTestService.totalUserTestBetween(startDate, endDate),
    ]);

    return {
      value: current,
      growthPercentage: this.calculateGrowth(current, prev),
    };
  }

  private async getActiveLearners(
    startDate: Date,
    endDate: Date,
    prevStart: Date,
    prevEnd: Date,
  ): Promise<KpiResponseDto> {
    const [current, prev] = await Promise.all([
      this.authService.countActiveUser(startDate, endDate),
      this.authService.countActiveUser(prevStart, prevEnd),
    ]);

    return {
      value: current,
      growthPercentage: this.calculateGrowth(current, prev),
    };
  }

  private async getNewLearners(
    startDate: Date,
    endDate: Date,
    prevStart: Date,
    prevEnd: Date,
  ): Promise<KpiResponseDto> {
    const [current, prev] = await Promise.all([
      this.authService.countUsersBetweenDays(startDate, endDate),
      this.authService.countUsersBetweenDays(prevStart, prevEnd),
    ]);

    return {
      value: current,
      growthPercentage: this.calculateGrowth(current, prev),
    };
  }

  private async getDeepInsights(
    start: Date,
    end: Date,
  ): Promise<DeepInsightsResponseDto> {
    const [testMode, regSource, rawScoreDist] = await Promise.all([
      this.userTestService.getTestModeInsight(start, end),
      this.authService.getRegSourceInsight(start, end),
      this.userTestService.getScoreInsight(start, end),
    ]);
    const scoreDist: ScoreDistInsightResponseDto = {
      ...rawScoreDist,
      sum:
        rawScoreDist.brand0_200 +
        rawScoreDist.brand200_450 +
        rawScoreDist.brand450_750 +
        rawScoreDist.brand750_990,
    };
    return {
      testMode,
      regSource,
      scoreDist,
    };
  }
}
