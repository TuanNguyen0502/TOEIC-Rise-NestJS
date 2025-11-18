import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Not, DataSource } from 'typeorm';
import { Test } from '../entities/test.entity';
import { Part } from '../entities/part.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { PageRequestDto } from './dto/page-request.dto';
import { ETestSetStatus } from '../enums/ETestSetStatus.enum';
import { ETestStatus } from '../enums/ETestStatus.enum';
import { GetTestsAdminDto } from './dto/get-tests-admin.dto';
import { TestRequestDto } from './dto/test-request.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { TestSet } from 'src/entities/test-set.entity';
import { QuestionExcelRequestDto } from './dto/question-excel-request.dto';
import * as XLSX from 'xlsx';
import { extractGroupNumber } from 'src/common/utils/code-generator.util';
import { PartService } from 'src/part/part.service';
import { QuestionGroupService } from 'src/question-group/question-group.service';
import { QuestionService } from 'src/question/question.service';
import { TagService } from 'src/tag/tag.service';
import { TestSetService } from 'src/test-set/test-set.service';
import { LearnerTestDetailResponse } from './dto/learner-test-detail-response.dto';
import { TestExcelMapper } from './mapper/test.mapper';
import { ConstraintViolationException } from 'src/exceptions/handles/constraint-violation.exception';

type ExcelCell = string | number | null;
type ExcelRow = ExcelCell[];
interface LearnerTestRawRow {
  testId: number;
  testName: string;
  numberOfLearnedTests: number;
  partId: number;
  partName: string;
  tagNames: string | null;
}

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    private readonly testSetService: TestSetService,
    private readonly tagService: TagService,
    private readonly partService: PartService,
    private readonly questionGroupService: QuestionGroupService,
    private readonly questionService: QuestionService,
    private dataSource: DataSource,
    private readonly testExcelMapper: TestExcelMapper,
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
  async getLearnerTestDetailById(
    id: number,
  ): Promise<LearnerTestDetailResponse> {
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
      .getRawMany<LearnerTestRawRow>();

    if (!testWithDetails || testWithDetails.length === 0) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test');
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
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test');
    }

    // Fetch all related data in a more efficient way than the Java N+1 loop
    const questionGroups =
      await this.questionGroupService.getQuestionGroupAsc(id);

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

  async importTest(
    file: Express.Multer.File,
    request: TestRequestDto,
  ): Promise<void> {
    if (!this.isValidFile(file)) {
      throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
    }

    const testSet = await this.testSetService.getTestSet(request.testSetId);
    if (!testSet) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test set');
    }

    const test = await this.createTest(
      this.testRepository,
      request.testName,
      testSet,
    );
    const questionExcelRequests = this.readFile(file);
    await this.processQuestions(test, questionExcelRequests);
  }

  readFile(file: Express.Multer.File): QuestionExcelRequestDto[] {
    try {
      const workbook: XLSX.WorkBook = XLSX.read(file.buffer, {
        type: 'buffer',
      });
      const sheetName: string = workbook.SheetNames[0];
      const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

      const rows: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        header: 1, // mảng mảng, tự map cột
        defval: null,
      });

      const result: QuestionExcelRequestDto[] = [];

      // Bỏ row header (index 0), bắt đầu từ i = 1
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const dto = this.testExcelMapper.mapRowToDTO(row);
        if (dto) result.push(dto);
      }

      return result;
    } catch {
      throw new AppException(ErrorCode.FILE_READ_ERROR);
    }
  }

  private async createTest(
    testRepo: Repository<Test>,
    testName: string,
    testSet: TestSet,
  ): Promise<Test> {
    const test = testRepo.create({
      name: testName,
      status: ETestStatus.PENDING, // enum ETestStatus.PENDING
      testSet,
      numberOfLearnerTests: 0,
    });
    return testRepo.save(test);
  }

  isValidFile(file: Express.Multer.File): boolean {
    const filePath = file.originalname;
    if (!filePath) return false;
    return (
      filePath.endsWith('.xlsx') ||
      filePath.endsWith('.xls') ||
      filePath.endsWith('.xlsm')
    );
  }

  private async processQuestions(
    test: Test,
    questions: QuestionExcelRequestDto[],
  ): Promise<void> {
    const sortedQuestions = [...questions].sort((a, b) => {
      const aNum = a.numberOfQuestions ?? Number.MAX_SAFE_INTEGER;
      const bNum = b.numberOfQuestions ?? Number.MAX_SAFE_INTEGER;
      return aNum - bNum;
    });

    const groupedQuestions = new Map<number, QuestionExcelRequestDto[]>();

    for (const question of sortedQuestions) {
      const groupNumber = extractGroupNumber(question.questionGroupId ?? null);
      // if (groupNumber == null) {
      //   if (question.numberOfQuestions == null)
      //     throw new AppException(ErrorCode.VALIDATION_ERROR);
      // }
      const groupKey = groupNumber ?? -question.numberOfQuestions!;
      if (!groupedQuestions.has(groupKey)) {
        groupedQuestions.set(groupKey, []);
      }
      groupedQuestions.get(groupKey)!.push(question);
    }
    for (const [, group] of groupedQuestions.entries()) {
      await this.processQuestionGroup(test, group);
    }
  }

  private async processQuestionGroup(
    test: Test,
    groupQuestions: QuestionExcelRequestDto[],
  ): Promise<void> {
    try {
      const firstQuestion = groupQuestions[0];
      if (!firstQuestion) return;
      const partNumber = firstQuestion.partNumber;
      if (partNumber == null) {
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Part');
      }

      const part = await this.partService.getPartById(partNumber);

      const questionGroup = await this.questionGroupService.createQuestionGroup(
        test,
        part,
        firstQuestion,
      );

      for (const dto of groupQuestions) {
        const tags = await this.tagService.getTagsFromString(dto.tags);
        // await this.questionService.createQuestion(dto, questionGroup, tags);
        await this.questionService.createQuestion(dto, questionGroup, tags);
      }
    } catch (e) {
      if (e instanceof ConstraintViolationException) throw e;
      if (e instanceof AppException) throw e;
      throw new AppException(ErrorCode.FILE_READ_ERROR);
    }
  }
}
