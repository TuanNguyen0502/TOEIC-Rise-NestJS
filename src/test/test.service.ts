import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Not } from 'typeorm';
import { Test } from '../entities/test.entity';
import { TestSet } from '../entities/test-set.entity';
import { Part } from '../entities/part.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { Question } from '../entities/question.entity';
import { Tag } from '../entities/tag.entity';
import { PageRequestDto } from './dto/page-request.dto';
import { ETestSetStatus } from '../enums/ETestSetStatus.enum';
import { ETestStatus } from '../enums/ETestStatus.enum';
import { GetTestsAdminDto } from './dto/get-tests-admin.dto';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
    @InjectRepository(QuestionGroup)
    private qgRepository: Repository<QuestionGroup>,
  ) {}

  /**
   * Corresponds to: testService.searchTestsByName(pageRequest)
   *
   * This implements the logic from TestServiceImpl.java:
   * - Filters by name (if provided)
   * - Filters by status: APPROVED
   * - Filters by testSet status: IN_USE
   * - Paginates results
   */
  async searchTestsByName(dto: PageRequestDto) {
    const { page, size, name } = dto;

    const whereOptions: FindManyOptions<Test>['where'] = {
      status: ETestStatus.APPROVED,
      testSet: {
        status: ETestSetStatus.IN_USE,
      },
    };

    if (name) {
      whereOptions.name = Like(`%${name}%`);
    }

    const [result, total] = await this.testRepository.findAndCount({
      where: whereOptions,
      relations: ['testSet'],
      order: { createdAt: 'DESC' },
      take: size,
      skip: page * size,
    });

    // Map to LearnerTestResponse format
    const learnerTestResponses = result.map((test) => ({
      id: test.id,
      testName: test.name,
      testSetName: test.testSet.name,
      numberOfLearnedTests: test.numberOfLearnerTests,
    }));

    // Format for PageResponse
    return {
      meta: {
        page: page,
        pageSize: size,
        pages: Math.ceil(total / size),
        total: total,
      },
      result: learnerTestResponses,
    };
  }

  /**
   * Corresponds to: testService.getLearnerTestDetailById(id)
   *
   * This translates the native SQL query from `TestRepository.java`
   * (`findListTagByIdOrderByPartName`) into a TypeORM QueryBuilder.
   */
  async getLearnerTestDetailById(id: number) {
    const testWithDetails = await this.testRepository
      .createQueryBuilder('t')
      .select([
        't.id AS testId',
        't.name AS testName',
        't.numberOfLearnerTests AS numberOfLearnedTests',
        'p.id AS partId',
        'p.name AS partName',
        // Use GROUP_CONCAT for aggregation, similar to the Java native query
        'GROUP_CONCAT(DISTINCT tg.name ORDER BY tg.name SEPARATOR "; ") AS tagNames',
      ])
      .innerJoin('t.questionGroups', 'qg')
      .innerJoin('qg.part', 'p')
      .leftJoin('qg.questions', 'q')
      .leftJoin('q.tags', 'tg')
      .where('t.id = :id', { id })
      .andWhere('t.status = :status', { status: ETestStatus.APPROVED })
      .groupBy('t.id, t.name, t.numberOfLearnerTests, p.name, p.id')
      .orderBy('p.id', 'ASC')
      .getRawMany();

    if (!testWithDetails || testWithDetails.length === 0) {
      throw new NotFoundException('Test not found');
    }

    // Process the raw query result
    const firstRow = testWithDetails[0];
    const response = {
      testId: firstRow.testId,
      testName: firstRow.testName,
      numberOfLearnedTests: firstRow.numberOfLearnedTests,
      learnerPartResponses: testWithDetails.map((row) => ({
        partId: row.partId,
        partName: row.partName,
        tagNames: row.tagNames ? row.tagNames.split('; ') : [],
      })),
    };

    return response;
  }

  /**
   * Corresponds to: testService.getAllTests(...)
   *
   * This implements the admin logic from TestServiceImpl.java:
   * - Filters by name (if provided)
   * - Filters by status (if provided)
   * - If status is NOT provided, it filters out DELETED.
   * - Paginates and sorts
   */
  async getAllTests(dto: GetTestsAdminDto) {
    const { page, size, sortBy, direction, name, status } = dto;

    const where: FindManyOptions<Test>['where'] = {};

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (status) {
      where.status = status;
    } else {
      // Default to not showing DELETED tests
      where.status = Not(ETestStatus.DELETED);
    }

    const [result, total] = await this.testRepository.findAndCount({
      where,
      order: { [sortBy]: direction },
      take: size,
      skip: page * size,
    });

    // Map to TestResponse DTO (as defined in Java)
    const testResponses = result.map((test) => ({
      id: test.id,
      name: test.name,
      status: test.status,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
    }));

    return {
      meta: {
        page,
        pageSize: size,
        pages: Math.ceil(total / size),
        total,
      },
      result: testResponses,
    };
  }

  /**
   * Corresponds to: testService.getTestDetailById(id)
   *
   * This replicates the logic from TestServiceImpl.java and
   * QuestionGroupServiceImpl.java to build the detailed DTO.
   */
  async getAdminTestDetailById(id: number) {
    const test = await this.testRepository.findOne({
      where: { id },
    });

    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }

    // Fetch all related data in a more efficient way than the Java N+1 loop
    const questionGroups = await this.qgRepository.find({
      where: { test: { id: id } },
      relations: ['part', 'questions', 'questions.tags'],
      order: {
        part: { id: 'ASC' }, // Order by part
        position: 'ASC', // Then by group position
        questions: { position: 'ASC' }, // Then by question position
      },
    });

    // Manually group by Part
    const groupedByPart = new Map<Part, QuestionGroup[]>();

    for (const qg of questionGroups) {
      if (!qg.part) continue;

      // If the part is not in the map yet, initialize it with an empty array
      if (!groupedByPart.has(qg.part)) {
        groupedByPart.set(qg.part, []);
      }
      groupedByPart.get(qg.part)!.push(qg); // The '!' non-null assertion is safe here
    }

    // Build the PartResponse DTOs
    const partResponses = Array.from(groupedByPart.entries()).map(
      ([part, groups]) => {
        // Build the QuestionGroupResponse DTOs
        const questionGroupResponses = groups.map((qg) => ({
          id: qg.id,
          audioUrl: qg.audioUrl,
          imageUrl: qg.imageUrl,
          passage: qg.passage,
          transcript: qg.transcript,
          position: qg.position,
          // Build the QuestionResponse DTOs
          questions: qg.questions.map((q) => ({
            id: q.id,
            position: q.position,
            content: q.content,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation,
            tags: q.tags.map((t) => t.name),
          })),
        }));

        return {
          id: part.id,
          name: part.name,
          questionGroups: questionGroupResponses,
        };
      },
    );

    // Build the final TestDetailResponse DTO
    return {
      id: test.id,
      name: test.name,
      status: test.status,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      partResponses: partResponses,
    };
  }
}
