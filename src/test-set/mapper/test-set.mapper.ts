import { TestSet } from 'src/entities/test-set.entity';
import { TestSetResponse } from '../dto/test-set-response.dto';
import { TestSetDetailResponse } from '../dto/test-set-detail-response.dto';
import { formatInTimeZone } from 'date-fns-tz';
import { PageResponse } from '../dto/page-response.dto';
import {
  DATE_TIME_PATTERN,
  TIMEZONE_VIETNAM,
} from 'src/common/constants/constants';

export class TestSetMapper {
  static toTestSetResponse = (entity: TestSet): TestSetResponse => ({
    id: entity.id,
    name: entity.name,
    status: entity.status,
    createdAt: formatInTimeZone(
      entity.createdAt,
      TIMEZONE_VIETNAM,
      DATE_TIME_PATTERN,
    ),
    updatedAt: formatInTimeZone(
      entity.updatedAt,
      TIMEZONE_VIETNAM,
      DATE_TIME_PATTERN,
    ),
  });

  static toTestSetDetailResponse = (
    entity: TestSet,
    testResponses: PageResponse<any>,
  ): TestSetDetailResponse => ({
    id: entity.id,
    name: entity.name,
    status: entity.status,
    createdAt: formatInTimeZone(
      entity.createdAt,
      TIMEZONE_VIETNAM,
      DATE_TIME_PATTERN,
    ),
    updatedAt: formatInTimeZone(
      entity.updatedAt,
      TIMEZONE_VIETNAM,
      DATE_TIME_PATTERN,
    ),
    testResponses,
  });
}
