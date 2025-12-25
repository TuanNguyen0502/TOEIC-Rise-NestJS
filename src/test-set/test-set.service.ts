import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { TestSet } from 'src/entities/test-set.entity';
import { ETestSetStatus } from 'src/enums/ETestSetStatus.enum';
import { TestSetResponse } from './dto/test-set-response.dto';
import { TestSetMapper } from './mapper/test-set.mapper';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { TestService } from 'src/test/test.service';
import { UpdateTestSetRequestDto } from './dto/update-test-set-request.dto';
import { CreateTestSetRequestDto } from './dto/create-test-set-request.dto';
import { GetTestSetsAdminDto } from './dto/get-test-sets-admin.dto';
import { GetTestSetDetailQueryDto } from './dto/get-test-set-detail-query.dto';

@Injectable()
export class TestSetService {
  constructor(
    @InjectRepository(TestSet)
    private readonly testSetRepository: Repository<TestSet>,
    @Inject(forwardRef(() => TestService))
    private readonly testService: TestService,
  ) {}

  async getAllTestSets(): Promise<TestSetResponse[]> {
    const testSets = await this.testSetRepository.find({
      where: { status: ETestSetStatus.IN_USE },
      order: { createdAt: 'DESC' },
    });

    return testSets.map(TestSetMapper.toTestSetResponse);
  }

  async getTestSetDetailById(id: number, query: GetTestSetDetailQueryDto) {
    const testSet = await this.testSetRepository.findOne({ where: { id } });

    if (!testSet) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test set');
    }

    const testResponses = await this.testService.getTestsByTestSetId(id, query);

    return TestSetMapper.toTestSetDetailResponse(testSet, testResponses);
  }

  async getAllTestSetsAdmin(dto: GetTestSetsAdminDto) {
    const { page, size, sortBy, direction, name, status } = dto;

    const where: FindManyOptions<TestSet>['where'] = {};

    if (name && name.trim().length > 0) {
      where.name = Like(`%${name.trim()}%`);
    }

    where.status = status ?? ETestSetStatus.IN_USE;

    const [result, total] = await this.testSetRepository.findAndCount({
      where,
      order: { [sortBy]: direction },
      take: size,
      skip: page * size,
    });

    const testSetResponses = result.map(TestSetMapper.toTestSetResponse);

    return {
      meta: {
        page,
        pageSize: size,
        pages: Math.ceil(total / size),
        total,
      },
      result: testSetResponses,
    };
  }

  async getTestSet(id: number): Promise<TestSet> {
    const testSet = await this.testSetRepository.findOne({
      where: { id },
    });
    if (testSet == null)
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'TestSet');
    return testSet;
  }

  async createTestSet(
    createTestSetRequest: CreateTestSetRequestDto,
  ): Promise<void> {
    const existedByName = await this.testSetRepository.findOne({
      where: { name: createTestSetRequest.testName },
    });

    if (existedByName) {
      throw new AppException(
        ErrorCode.RESOURCE_ALREADY_EXISTS,
        "Test set's name",
      );
    }

    const testSet = this.testSetRepository.create({
      name: createTestSetRequest.testName,
      status: ETestSetStatus.IN_USE,
    });

    await this.testSetRepository.save(testSet);
  }

  async deleteTestSetById(id: number): Promise<void> {
    const testSet = await this.testSetRepository.findOne({
      where: { id },
    });

    if (!testSet) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test set');
    }

    testSet.status = ETestSetStatus.DELETED;
    await this.testSetRepository.save(testSet);

    await this.testService.deleteTestsByTestSetId(id);
  }

  async updateTestSet(
    updateTestSetRequest: UpdateTestSetRequestDto,
  ): Promise<TestSetResponse> {
    const oldTestSet = await this.testSetRepository.findOne({
      where: { id: updateTestSetRequest.id },
    });

    if (!oldTestSet) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test set');
    }

    const existedByName = await this.testSetRepository.findOne({
      where: { name: updateTestSetRequest.testName },
    });

    if (existedByName && existedByName.id !== updateTestSetRequest.id) {
      throw new AppException(
        ErrorCode.RESOURCE_ALREADY_EXISTS,
        "Test set's name",
      );
    }

    oldTestSet.name = updateTestSetRequest.testName;

    if (
      updateTestSetRequest.status != null &&
      oldTestSet.status !== updateTestSetRequest.status
    ) {
      if (updateTestSetRequest.status === ETestSetStatus.DELETED) {
        await this.testService.deleteTestsByTestSetId(oldTestSet.id);
      }
      if (updateTestSetRequest.status === ETestSetStatus.IN_USE) {
        await this.testService.changeTestsStatusToPendingByTestSetId(
          oldTestSet.id,
        );
      }
      oldTestSet.status = updateTestSetRequest.status;
    }

    await this.testSetRepository.save(oldTestSet);

    return TestSetMapper.toTestSetResponse(oldTestSet);
  }
}
