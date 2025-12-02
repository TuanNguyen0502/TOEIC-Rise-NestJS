import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTest } from 'src/entities/user-test.entity';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { LearnerTestHistoryResponse } from './dto/learner-test-history-response.dto';
import { TestResultResponseDto } from './dto/test-result-response.dto';
import { UserAnswerGroupedByTagResponseDto } from './dto/user-answer-grouped-by-tag-response.dto';
import { formatInTimeZone } from 'date-fns-tz';
import {
  DATE_TIME_PATTERN,
  estimatedListeningScoreMap,
  estimatedReadingScoreMap,
  TIMEZONE_VIETNAM,
} from 'src/common/constants/constants';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { UserTestRequest } from './dto/user-test-request.dto';
import { TestResultOverallResponse } from 'src/test/dto/test-result-overall-response.dto';
import { UserService } from 'src/user/user.service';
import { TestService } from 'src/test/test.service';
import { Test } from 'src/entities/test.entity';
import { QuestionGroupService } from 'src/question-group/question-group.service';
import { UserAnswerRequest } from './dto/user-answer-request.dto';
import { QuestionService } from 'src/question/question.service';
import { UserTestMapper } from './mapper/user-test.mapper';
import { TestExcelMapper } from 'src/test/mapper/test.mapper';
import { groupBy } from 'src/common/utils/group-by.utils';
import { PartMapper } from 'src/part/mapper/part.mapper';
import { QuestionGroupMapper } from 'src/question-group/mapper/question-group.mapper';
import { UserAnswerMapper } from 'src/user-answer/mapper/user-answer.mapper';
import { LearnerTestPartResponse } from './dto/learner-test-part-response.dto';
import { QuestionMapper } from 'src/question/mapper/question.mapper';
import { LearnerTestQuestionResponse } from './dto/learner-test-question-response.dto';
import { LearnerTestPartsResponse } from './dto/learner-test-parts-response.dto';
import { ETestStatus } from 'src/enums/ETestStatus.enum';
import { UserAnswerOverallResponse, UserAnswerOverallResponseDto } from './dto/user-answer-overall-response.dto';

type LearnerTestHistoryRawRow = {
  id: number | string;
  createdAt: Date | string | null;
  partNames: string;
  correctAnswers: number | string;
  totalQuestions: number | string;
  score: number | string;
  timeSpent: number | string;
};

@Injectable()
export class UserTestService {
  constructor(
    @InjectRepository(UserTest)
    private readonly userTestRepository: Repository<UserTest>,
    private readonly userService: UserService,
    private readonly testService: TestService,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    private readonly questionGroupService: QuestionGroupService,
    private readonly questionService: QuestionService,
    private readonly userTestMapper: UserTestMapper,
    @InjectRepository(UserAnswer)
    private readonly userAnswerRepository: Repository<UserAnswer>,
    private readonly testMapper: TestExcelMapper,
    private readonly partMapper: PartMapper,
    private readonly questionGroupMapper: QuestionGroupMapper,
    private readonly userAnswerMapper: UserAnswerMapper,
    private readonly questionMapper: QuestionMapper,
  ) {}

  async allLearnerTestHistories(
    testId: number,
    email: string,
  ): Promise<LearnerTestHistoryResponse[]> {
    const rows = await this.userTestRepository
      .createQueryBuilder('ut')
      .innerJoin('ut.test', 't')
      .innerJoin('ut.user', 'u')
      .innerJoin('u.account', 'a')
      .where('t.id = :testId', { testId })
      .andWhere('a.email = :email', { email })
      .select([
        'ut.id AS id',
        'ut.createdAt AS createdAt',
        'ut.parts AS partNames',
        'ut.correctAnswers AS correctAnswers',
        'ut.totalQuestions AS totalQuestions',
        'ut.totalScore AS score',
        'ut.timeSpent AS timeSpent',
      ])
      .orderBy('ut.createdAt', 'DESC')
      .getRawMany<LearnerTestHistoryRawRow>();

    return rows.map(
      (row): LearnerTestHistoryResponse => ({
        id: Number(row.id),
        createdAt: row.createdAt
          ? formatInTimeZone(row.createdAt, TIMEZONE_VIETNAM, DATE_TIME_PATTERN)
          : null,
        partNames: Array.isArray(row.partNames)
          ? row.partNames
          : String(row.partNames).split(', '),
        correctAnswers: Number(row.correctAnswers),
        totalQuestions: Number(row.totalQuestions),
        score: Number(row.score),
        timeSpent: Number(row.timeSpent),
      }),
    );
  }

  async getUserTestResultById(email: string, userTestId: number): Promise<TestResultResponseDto> {
    // 1. Fetch UserTest cùng với các quan hệ (tương đương findByIdWithAnswersAndQuestions)
    // Chúng ta join sâu vào Question -> QuestionGroup -> Part để lấy tên Part luôn
    const userTest = await this.userTestRepository.findOne({
      where: { id: userTestId },
      relations: [
        'user',
        'user.account',
        'test',
        'userAnswers',
        'userAnswers.question',
        'userAnswers.question.tags',
        'userAnswers.question.questionGroup',
        'userAnswers.question.questionGroup.part' 
      ],
    });

    if (!userTest) {
      throw new NotFoundException('UserTest not found');
    }

    // 2. Verify user email (Java: check account email)
    if (userTest.user.account.email !== email) {
      throw new NotFoundException('Test Result not found for this user');
    }

    // 3. Chuẩn bị cấu trúc dữ liệu trả về
    const userAnswers = userTest.userAnswers;
    const userAnswersByPart: Record<string, UserAnswerGroupedByTagResponseDto[]> = {};

    // 4. Group user answers by Part Name
    // Trong JS, ta dùng reduce để gom nhóm thay vì Stream.collect(groupingBy)
    const answersByPart = userAnswers.reduce((acc, ua) => {
      // Lấy tên part từ relation đã join
      const partName = ua.question.questionGroup.part.name;
      if (!acc[partName]) {
        acc[partName] = [];
      }
      acc[partName].push(ua);
      return acc;
    }, {} as Record<string, typeof userAnswers>);

    // 5. Process từng Part
    for (const [partName, answersInPart] of Object.entries(answersByPart)) {
      
      // 5a. Flatten và Group by Tag Name bên trong Part
      // Logic: Một câu hỏi có thể có nhiều tag, ta cần tách ra từng entry (tagName, answer)
      const answersByTag: Record<string, typeof userAnswers> = {};

      for (const ua of answersInPart) {
        const tags = ua.question.tags || [];
        for (const tag of tags) {
          if (!answersByTag[tag.name]) {
            answersByTag[tag.name] = [];
          }
          answersByTag[tag.name].push(ua);
        }
      }

      // 5b. Tính toán thống kê cho từng Tag
      const groupedResponses: UserAnswerGroupedByTagResponseDto[] = [];

      for (const [tagName, answersForTag] of Object.entries(answersByTag)) {
        const correctAnswersCount = answersForTag.filter(ua => ua.isCorrect).length;
        const wrongAnswersCount = answersForTag.length - correctAnswersCount;
        const correctPercent = answersForTag.length === 0 
          ? 0.0 
          : (correctAnswersCount / answersForTag.length) * 100;

        // Map sang DTO chi tiết
        const userAnswerOverallResponses: UserAnswerOverallResponseDto[] = answersForTag.map(ua => ({
          userAnswerId: ua.id,
          position: ua.question.position,
          isCorrect: ua.question.correctOption === ua.answer // Logic từ Mapper
        }));

        groupedResponses.push({
          tag: tagName,
          correctAnswers: correctAnswersCount,
          wrongAnswers: wrongAnswersCount,
          correctPercent: correctPercent,
          userAnswerOverallResponses: userAnswerOverallResponses
        });
      }

      // 5c. Tính toán tổng quan cho Part (Total summary)
      const totalCorrect = answersInPart.filter(ua => ua.isCorrect).length;
      const totalQuestions = answersInPart.length;
      const totalWrong = totalQuestions - totalCorrect;
      const totalPercent = totalQuestions === 0 
        ? 0.0 
        : (totalCorrect / totalQuestions) * 100;

      // Thêm phần tổng kết vào cuối danh sách
      groupedResponses.push({
        tag: 'Total',
        correctAnswers: totalCorrect,
        wrongAnswers: totalWrong,
        correctPercent: totalPercent,
        userAnswerOverallResponses: null
      });

      // Gán vào kết quả cuối cùng
      userAnswersByPart[partName] = groupedResponses;
    }

    // 6. Map UserTest sang Response (Tương đương userTestMapper.toTestResultResponse)
    return this.mapToTestResultResponse(userTest, userAnswersByPart);
  }

  private mapToTestResultResponse(
    userTest: UserTest, 
    userAnswersByPart: Record<string, UserAnswerGroupedByTagResponseDto[]>
  ): TestResultResponseDto {
    
    // Xử lý parts: TypeORM có thể trả về string hoặc array tùy vào config cột
    let partsData: string[] | null = null;
    if (userTest.parts) {
        if (typeof userTest.parts === 'string') {
            try {
                partsData = JSON.parse(userTest.parts);
            } catch (e) {
                // Fallback nếu chuỗi không phải JSON (ví dụ: "Part 1,Part 2")
                partsData = (userTest.parts as string).split(','); 
            }
        } else {
            // Nếu đã là array (do TypeORM parse sẵn)
            partsData = userTest.parts;
        }
    }

    const response: TestResultResponseDto = {
      testId: userTest.test.id,
      userTestId: userTest.id,
      testName: userTest.test.name,
      
      parts: partsData, 
      
      totalQuestions: userTest.totalQuestions ?? 0,
      correctAnswers: userTest.correctAnswers ?? 0,
      correctPercent: userTest.correctPercent ? Number(userTest.correctPercent) : 0,
      timeSpent: userTest.timeSpent ?? 0,
      userAnswersByPart: userAnswersByPart,
    };

    if (userTest.totalScore !== null && userTest.totalScore !== undefined) {
      response.score = userTest.totalScore;
      response.listeningScore = userTest.listeningScore ?? 0;
      response.listeningCorrectAnswers = userTest.listeningCorrectAnswers ?? 0;
      response.readingScore = userTest.readingScore ?? 0;
      response.readingCorrectAnswers = userTest.readingCorrectAnswers ?? 0;
    }

    return response;
  }

  async calculateAndSaveUserTestResult(
    email: string,
    request: UserTestRequest,
  ): Promise<TestResultOverallResponse> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const test = await this.testService.findOneById(request.testId);
    if (!test) throw new NotFoundException('Test not found');

    test.numberOfLearnerTests += 1;
    await this.testRepository.save(test);

    const questionGroupIds = [
      ...new Set(request.answers.map((a) => a.questionGroupId)),
    ];
    await this.questionGroupService.checkQuestionGroupsExistByIds(
      questionGroupIds,
    );

    const userTest = this.userTestRepository.create({
      user,
      test,
      totalQuestions: request.answers.length,
      timeSpent: request.timeSpent,
      parts: request.parts ?? [],
      userAnswers: [],
    });

    await this.userTestRepository.save(userTest);

    if (!request.parts || request.parts.length === 0) {
      await this.calculateExamScore(userTest, request.answers);
    } else {
      await this.calculatePracticeScore(userTest, request.answers);
    }

    const saved = await this.userTestRepository.save(userTest);
    return this.userTestMapper.mapToDto(saved);
  }

  private async calculatePracticeScore(
    userTest: UserTest,
    answers: UserAnswerRequest[],
  ) {
    let correctAnswers = 0;
    let listeningQuestion = 0;
    let readingQuestion = 0;
    let listeningCorrect = 0;
    let readingCorrect = 0;

    const questionIds = [...new Set(answers.map((a) => a.questionId))];
    const questions =
      await this.questionService.getQuestionEntitiesByIds(questionIds);
    const map = new Map(questions.map((q) => [q.id, q]));

    for (const item of answers) {
      const question = map.get(item.questionId);
      if (!question)
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');

      const isCorrect = item.answer === question.correctOption;
      const isListening = this.questionGroupService.isListeningPart(
        question.questionGroup.part,
      );

      if (isListening) {
        listeningQuestion++;
        if (isCorrect) listeningCorrect++;
      } else {
        readingQuestion++;
        if (isCorrect) readingCorrect++;
      }

      if (isCorrect) correctAnswers++;

      const userAnswer = this.userAnswerRepository.create({
        userTest,
        question,
        questionGroupId: item.questionGroupId,
        answer: item.answer,
        isCorrect,
      });
      userTest.userAnswers.push(userAnswer);
    }

    userTest.correctAnswers = correctAnswers;
    userTest.totalListeningQuestions = listeningQuestion;
    userTest.totalReadingQuestions = readingQuestion;
    userTest.readingCorrectAnswers = readingCorrect;
    userTest.listeningCorrectAnswers = listeningCorrect;
    userTest.correctPercent = (correctAnswers / answers.length) * 100;
  }

  private async calculateExamScore(
    userTest: UserTest,
    answers: UserAnswerRequest[],
  ) {
    let correctAnswers = 0;
    let listeningCorrect = 0;
    let readingCorrect = 0;
    let listeningQuestion = 0;
    let readingQuestion = 0;

    const grouped = new Map<number, UserAnswerRequest[]>();
    for (const a of answers) {
      if (!grouped.has(a.questionGroupId)) grouped.set(a.questionGroupId, []);
      grouped.get(a.questionGroupId)!.push(a);
    }

    const groupIds = [...grouped.keys()];
    const groups =
      await this.questionGroupService.findAllByIdInFetchQuestions(groupIds);

    const groupMap = new Map(groups.map((g) => [g.id, g]));

    for (const [groupId, groupAnswers] of grouped.entries()) {
      const questionGroup = groupMap.get(groupId);
      if (!questionGroup)
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question group');

      const isListening = this.questionGroupService.isListeningPart(
        questionGroup.part,
      );

      const questionMap = new Map(
        questionGroup.questions.map((q) => [q.id, q]),
      );

      for (const item of groupAnswers) {
        const question = questionMap.get(item.questionId);
        if (!question)
          throw new AppException(ErrorCode.RESOURCE_ALREADY_EXISTS, 'Question');

        const isCorrect = item.answer === question.correctOption;

        if (isCorrect) {
          correctAnswers++;
          if (isListening) listeningCorrect++;
          else readingCorrect++;
        }

        if (isListening) listeningQuestion++;
        else readingQuestion++;

        userTest.userAnswers.push(
          this.userAnswerRepository.create({
            userTest,
            question,
            questionGroupId: item.questionGroupId,
            answer: item.answer,
            isCorrect,
          }),
        );
      }
    }

    userTest.correctAnswers = correctAnswers;
    userTest.correctPercent = (correctAnswers / answers.length) * 100;
    userTest.listeningCorrectAnswers = listeningCorrect;
    userTest.readingCorrectAnswers = readingCorrect;

    userTest.listeningScore =
      estimatedListeningScoreMap.get(listeningCorrect) ?? 0;
    userTest.readingScore = estimatedReadingScoreMap.get(readingCorrect) ?? 0;

    userTest.totalScore = userTest.listeningScore + userTest.readingScore;
    userTest.totalListeningQuestions = listeningQuestion;
    userTest.totalReadingQuestions = readingQuestion;
  }

  async getUserTestDetail(id: number, email: string) {
    const userTest = await this.userTestRepository
      .createQueryBuilder('ut')
      .leftJoinAndSelect('ut.test', 't')
      .leftJoinAndSelect('ut.userAnswers', 'ua')
      .leftJoinAndSelect('ua.question', 'q')
      .leftJoinAndSelect('q.questionGroup', 'qg')
      .leftJoinAndSelect('qg.part', 'p')
      .leftJoinAndSelect('ut.user', 'u')
      .leftJoinAndSelect('u.account', 'acc')
      .where('ut.id = :id', { id })
      .andWhere('acc.email = :email', { email })
      .getOne();
    if (!userTest) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User test');
    }

    const response = this.testMapper.toLearnerTestPartsResponse(userTest.test);

    const answerByPart = groupBy(
      userTest.userAnswers,
      (ua) => ua.question.questionGroup.part,
    );

    let partResponses: LearnerTestPartResponse[] = [];

    for (const [part, answers] of answerByPart) {
      const partResponse = this.partMapper.toLearnerTestPartResponse(part);

      const answerByGroup = groupBy(answers, (ua) => ua.question.questionGroup);

      const questionGroupResponses = [...answerByGroup.entries()]
        .sort((a, b) => a[0].position - b[0].position)
        .map(([questionGroup, userAnswers]) => {
          const questionGroupResp =
            this.questionGroupMapper.toLearnerTestQuestionGroupResponse(
              questionGroup,
            );

          const questionAndAnswers = userAnswers
            .sort((a, b) => a.question.position - b.question.position)
            .map((ua) => this.userAnswerMapper.toLearnerAnswerResponse(ua));

          questionGroupResp.questions = questionAndAnswers;
          return questionGroupResp;
        });

      partResponse.questionGroups = questionGroupResponses;
      partResponses.push(partResponse);
    }

    // Sort part by name
    partResponses = partResponses.sort((a, b) =>
      a.partName.localeCompare(b.partName),
    );

    response.partResponses = partResponses;
    return response;
  }

  async getTestByIdAndParts(
    testId: number,
    parts: number[],
  ): Promise<LearnerTestPartsResponse> {
    // Find test by ID and status APPROVED
    const test = await this.testRepository.findOne({
      where: { id: testId, status: ETestStatus.APPROVED },
    });

    if (!test) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test');
    }

    // Get question groups grouped by parts
    const partGroupData =
      await this.questionGroupService.getQuestionGroupsByTestIdGroupByParts(
        testId,
        parts,
      );

    // Map to response format
    const partResponses: LearnerTestPartResponse[] = partGroupData
      .map(({ part, groups }) => {
        const questionGroupResponses = groups
          .sort((a, b) => a.position - b.position)
          .map((group) => {
            const questionResponses: LearnerTestQuestionResponse[] =
              group.questions
                .sort((a, b) => a.position - b.position)
                .map((question) =>
                  this.questionMapper.toLearnerTestQuestionResponse(question),
                );

            const groupResponse =
              this.questionGroupMapper.toLearnerTestQuestionGroupResponse(
                group,
              );
            groupResponse.questions = questionResponses;
            return groupResponse;
          });

        const partResponse = this.partMapper.toLearnerTestPartResponse(part);
        partResponse.questionGroups = questionGroupResponses;
        return partResponse;
      })
      .sort((a, b) => a.partName.localeCompare(b.partName));

    const learnerTestPartsResponse =
      this.testMapper.toLearnerTestPartsResponse(test);
    learnerTestPartsResponse.partResponses = partResponses;
    return learnerTestPartsResponse;
  }

  async getUserAnswersGroupedByPart(
    email: string,
    userTestId: number,
  ): Promise<Record<string, UserAnswerOverallResponse[]>> {
    // Find user test with answers and questions
    const userTest = await this.userTestRepository.findOne({
      where: { id: userTestId },
      relations: [
        'user',
        'user.account',
        'userAnswers',
        'userAnswers.question',
        'userAnswers.question.questionGroup',
        'userAnswers.question.questionGroup.part',
      ],
    });

    if (!userTest) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'UserTest');
    }

    // Verify that the userTest belongs to the user with the given email
    if (userTest.user.account.email !== email) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test Result');
    }

    const result: Record<string, UserAnswerOverallResponse[]> = {};

    for (const userAnswer of userTest.userAnswers) {
      const partName = userAnswer.question.questionGroup.part.name;
      const answerResponse: UserAnswerOverallResponse = {
        userAnswerId: userAnswer.id,
        position: userAnswer.question.position,
        correctAnswer: userAnswer.question.correctOption,
        userAnswer: userAnswer.answer || '',
      };

      if (!result[partName]) {
        result[partName] = [];
      }
      result[partName].push(answerResponse);
    }

    return result;
  }
}
