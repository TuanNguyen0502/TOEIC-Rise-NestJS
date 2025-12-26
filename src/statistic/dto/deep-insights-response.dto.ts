import { TestModeInsightResponseDto } from './test-mode-insight-response.dto';
import { RegSourceInsightResponseDto } from './reg-source-insight-response.dto';
import { ScoreDistInsightResponseDto } from './score-dist-insight-response.dto';

export class DeepInsightsResponseDto {
  testMode: TestModeInsightResponseDto;
  regSource: RegSourceInsightResponseDto;
  scoreDist: ScoreDistInsightResponseDto;
}
