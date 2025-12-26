import { KpiResponseDto } from './kpi-response.dto';
import { ActivityTrendResponseDto } from './activity-trend-response.dto';
import { DeepInsightsResponseDto } from './deep-insights-response.dto';

export class AdminDashboardResponseDto {
  newLearners: KpiResponseDto;
  activeUsers: KpiResponseDto;
  totalTests: KpiResponseDto;
  aiConversations: KpiResponseDto;
  activityTrend: ActivityTrendResponseDto;
  deepInsights: DeepInsightsResponseDto;
}
