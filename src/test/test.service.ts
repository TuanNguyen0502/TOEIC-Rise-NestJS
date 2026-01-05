import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Not, In } from 'typeorm';
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
import { PageResponse } from 'src/test-set/dto/page-response.dto';
import { GetTestSetDetailQueryDto } from 'src/test-set/dto/get-test-set-detail-query.dto';

type ExcelCell = string | number | null;
type ExcelRow = ExcelCell[];

type LearnerTestDetailRaw = {
  testId: number;
  testName: string;
  numberOfLearnedTests: number;
  partId: number;
  partName: string;
  tagNames: string | null;
};

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @Inject(forwardRef(() => TestSetService))
    private readonly testSetService: TestSetService,
    private readonly tagService: TagService,
    private readonly partService: PartService,
    private readonly questionGroupService: QuestionGroupService,
    private readonly questionService: QuestionService,
    private readonly testExcelMapper: TestExcelMapper,
  ) {}

  async searchTestsByName(dto: PageRequestDto) {
    const { page, size, name, sort } = dto;

    const whereOptions: FindManyOptions<Test>['where'] = {
      status: ETestStatus.APPROVED,
      testSet: {
        status: ETestSetStatus.IN_USE,
      },
    };

    if (sort) {
      const testSetIds = sort
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

      if (testSetIds.length > 0) {
        whereOptions.testSet = {
          status: ETestSetStatus.IN_USE,
          id: In(testSetIds),
        };
      }
    }

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
      numberOfLearnerTests: Number(test.numberOfLearnerTests),
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

  async getLearnerTestDetailById(
    id: number,
  ): Promise<LearnerTestDetailResponse> {
    // Use native query to match Java implementation exactly
    const testWithDetails: LearnerTestDetailRaw[] =
      await this.testRepository.query(
        `
        SELECT 
          t.id AS testId, 
          t.name AS testName, 
          t.number_of_learner_tests AS numberOfLearnedTests, 
          p.name AS partName, 
          p.id AS partId,
          GROUP_CONCAT(DISTINCT tg.name ORDER BY tg.name SEPARATOR '; ') AS tagNames 
        FROM tests t 
        INNER JOIN question_groups qg ON qg.test_id = t.id 
        INNER JOIN questions q ON q.question_group_id = qg.id 
        INNER JOIN parts p ON qg.part_id = p.id 
        LEFT JOIN questions_tags qtg ON qtg.question_id = q.id 
        LEFT JOIN tags tg ON qtg.tag_id = tg.id 
        WHERE t.id = ? AND t.status = 'APPROVED'
        GROUP BY t.id, t.name, t.number_of_learner_tests, p.name, p.id 
        ORDER BY p.id
        `,
        [id],
      );

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

  async getAdminTestDetailById(id: number) {
    const test = await this.testRepository.findOne({
      where: { id },
    });

    if (!test) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test');
    }

    const questionGroups =
      await this.questionGroupService.getQuestionGroupAsc(id);

    const groupsMap = new Map<
      number,
      { part: Part; groups: QuestionGroup[] }
    >();

    for (const qg of questionGroups) {
      if (!qg.part) continue;

      const partId = qg.part.id;

      // Initialize if not exists
      if (!groupsMap.has(partId)) {
        groupsMap.set(partId, { part: qg.part, groups: [] });
      }

      // Push to the existing group
      groupsMap.get(partId)!.groups.push(qg);
    }

    // Build the PartResponse DTOs
    const partResponses = Array.from(groupsMap.values())
      .map(({ part, groups }) => {
        // Map to QuestionGroupResponse
        const questionGroupResponses = groups.map((qg) => ({
          id: qg.id,
          audioUrl: qg.audioUrl,
          imageUrl: qg.imageUrl,
          passage: qg.passage,
          transcript: qg.transcript,
          position: qg.position,
          // Map to QuestionResponse
          questions: (qg.questions || []).map((q) => ({
            id: q.id,
            position: q.position,
            content: q.content,
            options: q.options, // StringListTransformer handles JSON parsing
            correctOption: q.correctOption,
            explanation: q.explanation,
            tags: (q.tags || []).map((t) => t.name),
          })),
        }));

        return {
          id: part.id,
          name: part.name,
          questionGroups: questionGroupResponses,
        };
      })
      // Match Java: Sort parts by Name alphabetically
      .sort((a, b) => a.name.localeCompare(b.name));

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
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test Set');
    }

    const existingTest = await this.testRepository.findOne({
      where: { name: request.testName },
    });

    if (existingTest) {
      throw new AppException(ErrorCode.RESOURCE_ALREADY_EXISTS, "Test's name");
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
    if (!test.createdAt) {
      test.createdAt = new Date();
    }
    if (!test.updatedAt) {
      test.updatedAt = new Date();
    }
    return testRepo.save(test);
  }

  isValidFile(file: Express.Multer.File | undefined): boolean {
    if (!file || !file.originalname) return false;

    const filePath = file.originalname;
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

  async findOneById(id: number): Promise<Test | null> {
    return this.testRepository.findOne({
      where: { id },
    });
  }

  async deleteTestsByTestSetId(testSetId: number): Promise<void> {
    const tests = await this.testRepository.find({
      where: {
        testSet: { id: testSetId },
      },
    });

    if (!tests.length) return;

    for (const test of tests) {
      test.status = ETestStatus.DELETED;
    }

    await this.testRepository.save(tests);
  }

  async getTestsByTestSetId(
    testSetId: number,
    dto: GetTestSetDetailQueryDto,
  ): Promise<PageResponse<any>> {
    const { page, size, sortBy, direction, name, status } = dto;

    const where: FindManyOptions<Test>['where'] = {
      testSet: { id: testSetId },
    };

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (status) {
      where.status = status;
    } else {
      where.status = Not(ETestStatus.DELETED);
    }

    const [result, total] = await this.testRepository.findAndCount({
      where,
      order: { [sortBy]: direction },
      take: size,
      skip: page * size,
    });

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

  async changeTestsStatusToPendingByTestSetId(
    testSetId: number,
  ): Promise<void> {
    const tests = await this.testRepository.find({
      where: { testSet: { id: testSetId } },
    });

    if (!tests.length) return;

    for (const test of tests) {
      test.status = ETestStatus.PENDING;
    }

    await this.testRepository.save(tests);
  }

  async changeTestStatusById(
    id: number,
    status: ETestStatus,
  ): Promise<boolean> {
    const test = await this.testRepository.findOne({
      where: { id },
    });

    if (!test) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test');
    }

    test.status = status;
    await this.testRepository.save(test);

    return true;
  }

  async updateTest(
    id: number,
    testUpdateRequest: { name: string },
  ): Promise<{
    id: number;
    name: string;
    status: ETestStatus;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // Validate test ID
    const existingTest = await this.testRepository.findOne({
      where: { id },
    });

    if (!existingTest) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test');
    }

    // Check for name uniqueness
    const testWithSameName = await this.testRepository.findOne({
      where: { name: testUpdateRequest.name },
    });

    if (testWithSameName && testWithSameName.id !== existingTest.id) {
      throw new AppException(ErrorCode.RESOURCE_ALREADY_EXISTS, "Test's name");
    }

    // Update fields
    existingTest.name = testUpdateRequest.name;
    existingTest.status = ETestStatus.PENDING;

    const updatedTest = await this.testRepository.save(existingTest);

    // Return TestResponse format
    return {
      id: updatedTest.id,
      name: updatedTest.name,
      status: updatedTest.status,
      createdAt: updatedTest.createdAt,
      updatedAt: updatedTest.updatedAt,
    };
  }

  async totalTest(): Promise<number> {
    return this.testRepository.count();
  }
}
