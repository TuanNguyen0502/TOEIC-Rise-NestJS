import { Injectable } from '@nestjs/common';
import { Part } from 'src/entities/part.entity';
import { LearnerTestPartResponse } from 'src/user-test/dto/learner-test-part-response.dto';

@Injectable()
export class PartMapper {
  toLearnerTestPartResponse(part: Part): LearnerTestPartResponse {
    return {
      id: part.id,
      partName: part.name,
      questionGroups: [],
    };
  }
}
