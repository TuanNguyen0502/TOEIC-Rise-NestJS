import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSet } from 'src/entities/test-set.entity';
import { ETestSetStatus } from 'src/enums/ETestSetStatus.enum';
import { TestSetResponse } from './dto/test-set-response.dto';
import { TestSetMapper } from './mapper/test-set.mapper';

@Injectable()
export class TestSetService {
  constructor(
    @InjectRepository(TestSet)
    private readonly testSetRepository: Repository<TestSet>,
  ) {}
  async getAllTestSets(): Promise<TestSetResponse[]> {
    const testSets = await this.testSetRepository.find({
      where: { status: ETestSetStatus.IN_USE },
      order: { createdAt: 'DESC' },
    });

    return testSets.map(TestSetMapper.toTestSetResponse);
  }
}
