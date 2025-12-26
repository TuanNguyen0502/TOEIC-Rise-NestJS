import { ActivityPointResponseDto } from './activity-point-response.dto';

export class ActivityTrendResponseDto {
  totalSubmissions: number;
  points: ActivityPointResponseDto[];
}
