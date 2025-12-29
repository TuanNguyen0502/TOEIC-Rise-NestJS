import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTest } from 'src/entities/user-test.entity';
import { LearnerTestHistoryResponse } from './dto/learner-test-history-response.dto';
import { formatInTimeZone } from 'date-fns-tz';
import {
  DATE_TIME_PATTERN,
  estimatedListeningScoreMap,
  estimatedReadingScoreMap,
  TIMEZONE_VIETNAM,
} from 'src/common/constants/constants';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { Test } from 'src/entities/test.entity';
import { QuestionGroupService } from 'src/question-group/question-group.service';
import { TestExcelMapper } from 'src/test/mapper/test.mapper';
import { PartMapper } from 'src/part/mapper/part.mapper';
import { QuestionGroupMapper } from 'src/question-group/mapper/question-group.mapper';
import { LearnerTestPartResponse } from './dto/learner-test-part-response.dto';
import { QuestionMapper } from 'src/question/mapper/question.mapper';
import { LearnerTestQuestionResponse } from './dto/learner-test-question-response.dto';
import { LearnerTestPartsResponse } from './dto/learner-test-parts-response.dto';
import { ETestStatus } from 'src/enums/ETestStatus.enum';
import { UserAnswerOverallResponse } from './dto/user-answer-overall-response.dto';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { Part } from 'src/entities/part.entity';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { UserAnswerMapper } from 'src/user-answer/mapper/user-answer.mapper';
import { TestResultResponseDto } from './dto/test-result-response.dto';
import { UserAnswerGroupedByTagResponseDto } from './dto/user-answer-grouped-by-tag-response.dto';
import { UserTestMapper } from './mapper/user-test.mapper';
import { UserTestRequest } from './dto/user-test-request.dto';
import { TestResultOverallResponse } from 'src/test/dto/test-result-overall-response.dto';
import { User } from 'src/entities/user.entity';
import { UserAnswerRequest } from './dto/user-answer-request.dto';
import { Question } from 'src/entities/question.entity';
import { QuestionService } from 'src/question/question.service';

type LearnerTestHistoryRawRow = {
  id: number;
  createdAt: Date | string | null;
  partNames: string;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  timeSpent: number;
};

type CountUserTestByModeRaw = {
  fullTest: string; // raw query luôn trả về string
  pratice: string;
};

type CountUserTestByScoreRaw = {
  brand0_200: string;
  brand200_450: string;
  brand450_750: string;
  brand750_990: string;
};

type SubmissionByDateRaw = {
  date: Date;
  count: string; // raw SQL luôn trả string
};

@Injectable()
export class UserTestService {
  constructor(
    @InjectRepository(UserTest)
    private readonly userTestRepository: Repository<UserTest>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserAnswer)
    private readonly userAnswerRepository: Repository<UserAnswer>,
    private readonly questionGroupService: QuestionGroupService,
    private readonly questionService: QuestionService,
    private readonly testMapper: TestExcelMapper,
    private readonly partMapper: PartMapper,
    private readonly questionGroupMapper: QuestionGroupMapper,
    private readonly questionMapper: QuestionMapper,
    private readonly userAnswerMapper: UserAnswerMapper,
    private readonly userTestMapper: UserTestMapper,
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
      .map(({ part, groups }: { part: Part; groups: QuestionGroup[] }) => {
        const questionGroupResponses = groups
          .sort((a: QuestionGroup, b: QuestionGroup) => a.position - b.position)
          .map((group: QuestionGroup) => {
            const questionResponses: LearnerTestQuestionResponse[] = (
              group.questions || []
            )
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

  async getUserTestDetail(
    userTestId: number,
    email: string,
  ): Promise<LearnerTestPartsResponse> {
    const userTest = await this.userTestRepository.findOne({
      relations: [
        'test',
        'userAnswers',
        'userAnswers.question',
        'userAnswers.question.questionGroup',
        'userAnswers.question.questionGroup.part',
      ],
      where: { id: userTestId, user: { account: { email: email } } },
    });
    if (!userTest)
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User test');

    const learnerTestPartsResponse = this.testMapper.toLearnerTestPartsResponse(
      userTest.test,
    );

    const answerByPart = userTest.userAnswers.reduce((acc, ua) => {
      const part = ua.question.questionGroup.part;
      const partId = part.id;
      if (!acc.has(partId)) {
        acc.set(partId, { part: part, answers: [] });
      }
      acc.get(partId)!.answers.push(ua);
      return acc;
    }, new Map<number, { part: Part; answers: UserAnswer[] }>());

    const partResponses = [...answerByPart.values()]
      .map(({ part, answers }) => {
        const answerByQuestionGroups = answers.reduce((acc, ua) => {
          const qg = ua.question.questionGroup;
          const qgId = qg.id;
          if (!acc.has(qgId)) {
            acc.set(qgId, { questionGroup: qg, userAnswers: [] });
          }
          acc.get(qgId)!.userAnswers.push(ua);
          return acc;
        }, new Map<number, { questionGroup: QuestionGroup; userAnswers: UserAnswer[] }>());

        const questionGroupResponses = [...answerByQuestionGroups.values()]
          .sort((a, b) => a.questionGroup.position - b.questionGroup.position)
          .map(({ questionGroup, userAnswers }) => {
            const questionAndAnswers = [...userAnswers]
              .sort((a, b) => a.question.position - b.question.position)
              .map((ua) => this.userAnswerMapper.toLearnerAnswerResponse(ua));

            const qgResponse =
              this.questionGroupMapper.toLearnerTestQuestionGroupResponse(
                questionGroup,
              );
            qgResponse.questions = questionAndAnswers;
            return qgResponse;
          });

        const partResponse = this.partMapper.toLearnerTestPartResponse(part);
        partResponse.questionGroups = questionGroupResponses;
        return partResponse;
      })
      .sort((a, b) => a.partName.localeCompare(b.partName));

    learnerTestPartsResponse.partResponses = partResponses;
    return learnerTestPartsResponse;
  }

  async getUserTestResultById(
    email: string,
    userTestId: number,
  ): Promise<TestResultResponseDto> {
    const userTest = await this.userTestRepository.findOne({
      relations: [
        'test',
        'user',
        'user.account',
        'userAnswers',
        'userAnswers.question',
        'userAnswers.question.tags',
        'userAnswers.question.questionGroup',
        'userAnswers.question.questionGroup.part',
      ],
      where: { id: userTestId },
    });

    if (!userTest)
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'UserTest');

    if (userTest.user.account.email !== email) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test Result');
    }

    const userAnswers = userTest.userAnswers ?? [];

    // group answers by part name
    const answersByPart = new Map<string, any[]>();
    for (const ua of userAnswers) {
      const groupId = ua.questionGroupId ?? ua.question?.questionGroup?.id;
      if (!groupId) continue;
      const finalPartName = ua.question?.questionGroup?.part?.name ?? 'Unknown';
      if (!answersByPart.has(finalPartName)) {
        answersByPart.set(finalPartName, []);
      }
      answersByPart.get(finalPartName)!.push(ua);
    }

    const userAnswersByPart: Record<
      string,
      UserAnswerGroupedByTagResponseDto[]
    > = {};

    for (const [partName, answersInPart] of answersByPart.entries()) {
      // group by tag name
      const answersByTag = answersInPart.reduce<Map<string, UserAnswer[]>>(
        (acc, ua: UserAnswer) => {
          for (const tag of ua.question.tags) {
            const tagName = tag.name;
            if (!acc.has(tagName)) acc.set(tagName, []);
            acc.get(tagName)!.push(ua);
          }
          return acc;
        },
        new Map(),
      );

      const groupedResponses: UserAnswerGroupedByTagResponseDto[] = [];
      let totalEntry: UserAnswerGroupedByTagResponseDto | null = null;

      for (const [tagName, answersForTag] of answersByTag.entries()) {
        const correctAnswers = answersForTag.filter(
          (ua) => ua.isCorrect,
        ).length;
        const wrongAnswers = answersForTag.length - correctAnswers;
        const correctPercent =
          answersForTag.length === 0
            ? 0
            : (correctAnswers / answersForTag.length) * 100;
        const userAnswerOverallResponses = answersForTag.map((ua) =>
          this.userAnswerMapper.toUserAnswerGroupedByTagResponse(ua),
        );

        groupedResponses.push({
          tag: tagName,
          correctAnswers,
          wrongAnswers,
          correctPercent,
          userAnswerOverallResponses,
        });
      }

      // totals per part
      const totalCorrect = answersInPart.filter(
        (ua: UserAnswer) => ua.isCorrect,
      ).length;
      const totalQuestions = answersInPart.length;
      const totalWrong = totalQuestions - totalCorrect;
      const totalPercent =
        totalQuestions === 0 ? 0 : (totalCorrect / totalQuestions) * 100;

      totalEntry = {
        tag: 'Total',
        correctAnswers: totalCorrect,
        wrongAnswers: totalWrong,
        correctPercent: totalPercent,
        userAnswerOverallResponses: null,
      };

      // Sort tags by ascending correctPercent and append Total at the end
      groupedResponses.sort((a, b) => a.correctPercent - b.correctPercent);
      if (totalEntry) {
        groupedResponses.push(totalEntry);
      }

      userAnswersByPart[partName] = groupedResponses;
    }

    return this.userTestMapper.toTestResultResponse(
      userTest,
      userAnswersByPart,
    );
  }

  async calculateAndSaveUserTestResult(
    email: string,
    request: UserTestRequest,
  ): Promise<TestResultOverallResponse> {
    const answers: UserAnswerRequest[] = Array.isArray(request?.answers)
      ? request.answers
      : [];
    const parts: string[] = Array.isArray(request?.parts) ? request.parts : [];
    const timeSpent: number = Number(request?.timeSpent ?? 0);
    const testId: number = Number(request?.testId);

    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });
    if (!user) throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User');

    const test = await this.testRepository.findOne({
      where: { id: testId },
    });
    if (!test) throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test');

    test.numberOfLearnerTests = (Number(test.numberOfLearnerTests) || 0) + 1;
    await this.testRepository.save(test);

    // Validate question groups
    const questionGroupIds = Array.from(
      new Set(answers.map((a) => a.questionGroupId)),
    );
    await this.questionGroupService.checkQuestionGroupsExistByIds(
      questionGroupIds,
    );

    const userTest = this.userTestRepository.create({
      user,
      test,
      totalQuestions: answers.length,
      timeSpent,
      parts,
      userAnswers: [],
    });

    // Save userTest first to get ID
    const savedUserTest = await this.userTestRepository.save(userTest);

    if (!parts || parts.length === 0) {
      await this.calculateExamScore(savedUserTest, answers);
    } else {
      await this.calculatePracticeScore(savedUserTest, answers);
    }

    // Update userTest with calculated scores
    await this.userTestRepository.save(savedUserTest);
    return this.userTestMapper.mapToDto(savedUserTest);
  }

  private async calculatePracticeScore(
    userTest: UserTest,
    answers: UserAnswerRequest[],
  ) {
    let correctAnswers = 0;
    let listeningQuestion = 0;
    let readingQuestion = 0;
    let listeningCorrectAnswers = 0;
    let readingCorrectAnswers = 0;

    const questionIds = [...new Set(answers.map((a) => a.questionId))];
    const questions =
      await this.questionService.getQuestionEntitiesByIds(questionIds);
    const questionMap = new Map<number, Question>(
      questions.map((q) => [q.id, q]),
    );

    // Pre-allocate array to avoid repeated reallocation
    const userAnswersToSave: UserAnswer[] = [];

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question)
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');

      const isCorrect =
        !!answer.answer && answer.answer === question.correctOption;
      const isListeningPart = this.questionGroupService.isListeningPart(
        question.questionGroup.part,
      );

      if (isListeningPart) {
        listeningQuestion++;
        if (isCorrect) listeningCorrectAnswers++;
      } else {
        readingQuestion++;
        if (isCorrect) readingCorrectAnswers++;
      }
      if (isCorrect) correctAnswers++;

      userAnswersToSave.push(
        this.userAnswerRepository.create({
          userTest,
          question,
          questionGroupId: answer.questionGroupId,
          answer: answer.answer,
          isCorrect,
        }),
      );
    }

    // Batch save user answers instead of pushing to array
    if (userAnswersToSave.length > 0) {
      await this.userAnswerRepository.save(userAnswersToSave);
      userTest.userAnswers = userAnswersToSave;
    }

    userTest.correctAnswers = correctAnswers;
    userTest.totalListeningQuestions = listeningQuestion;
    userTest.totalReadingQuestions = readingQuestion;
    userTest.readingCorrectAnswers = readingCorrectAnswers;
    userTest.listeningCorrectAnswers = listeningCorrectAnswers;
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

    const questionIds = [...new Set(answers.map((a) => a.questionId))];
    const questions =
      await this.questionService.getQuestionEntitiesByIdsWithPart(questionIds);
    const questionMap = new Map<number, Question>(
      questions.map((q) => [q.id, q]),
    );

    // Pre-allocate array to avoid repeated reallocation
    const userAnswersToSave: UserAnswer[] = [];

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question || !question.questionGroup?.part)
        throw new AppException(
          ErrorCode.RESOURCE_NOT_FOUND,
          'Question or Part relation missing',
        );

      const isCorrect =
        !!answer.answer && answer.answer === question.correctOption;

      const isListeningPart = this.questionGroupService.isListeningPart(
        question.questionGroup.part,
      );

      if (isCorrect) {
        correctAnswers++;
        if (isListeningPart) listeningCorrect++;
        else readingCorrect++;
      }

      if (isListeningPart) listeningQuestion++;
      else readingQuestion++;

      userAnswersToSave.push(
        this.userAnswerRepository.create({
          userTest,
          question,
          questionGroupId: answer.questionGroupId,
          answer: answer.answer,
          isCorrect,
        }),
      );
    }

    // Batch save user answers instead of pushing to array
    if (userAnswersToSave.length > 0) {
      await this.userAnswerRepository.save(userAnswersToSave);
      userTest.userAnswers = userAnswersToSave;
    }

    userTest.correctAnswers = correctAnswers;
    userTest.correctPercent = (correctAnswers / answers.length) * 100;
    userTest.listeningCorrectAnswers = listeningCorrect;
    userTest.readingCorrectAnswers = readingCorrect;
    userTest.listeningScore = estimatedListeningScoreMap.get(listeningCorrect);
    userTest.readingScore = estimatedReadingScoreMap.get(readingCorrect);
    userTest.totalScore =
      (userTest.listeningScore ?? 0) + (userTest.readingScore ?? 0);
    userTest.totalListeningQuestions = listeningQuestion;
    userTest.totalReadingQuestions = readingQuestion;
  }

  async totalUserTest(): Promise<number> {
    return this.userTestRepository.count();
  }

  async totalUserTestBetween(from: Date, to: Date): Promise<number> {
    const testMode = await this.countUserTestByMode(from, to);
    return testMode.fullTest + testMode.pratice;
  }

  async countUserTestByMode(
    start: Date,
    end: Date,
  ): Promise<{ fullTest: number; pratice: number }> {
    const result = await this.userTestRepository
      .createQueryBuilder('ut')
      .select([
        'COALESCE(SUM(CASE WHEN ut.totalScore IS NOT NULL THEN 1 ELSE 0 END), 0) AS fullTest',
        'COALESCE(SUM(CASE WHEN ut.totalScore IS NULL THEN 1 ELSE 0 END), 0) AS pratice',
      ])
      .where('ut.createdAt >= :start', { start })
      .andWhere('ut.createdAt < :end', { end })
      .getRawOne<CountUserTestByModeRaw>();

    return {
      fullTest: parseInt(result?.fullTest || '0', 10),
      pratice: parseInt(result?.pratice || '0', 10),
    };
  }

  async countUserTestByScore(
    start: Date,
    end: Date,
  ): Promise<{
    brand0_200: number;
    brand200_450: number;
    brand450_750: number;
    brand750_990: number;
  }> {
    const result = await this.userTestRepository
      .createQueryBuilder('ut')
      .select([
        'COALESCE(SUM(CASE WHEN ut.totalScore BETWEEN 0 AND 200 THEN 1 ELSE 0 END), 0) AS brand0_200',
        'COALESCE(SUM(CASE WHEN ut.totalScore BETWEEN 201 AND 450 THEN 1 ELSE 0 END), 0) AS brand200_450',
        'COALESCE(SUM(CASE WHEN ut.totalScore BETWEEN 451 AND 750 THEN 1 ELSE 0 END), 0) AS brand450_750',
        'COALESCE(SUM(CASE WHEN ut.totalScore BETWEEN 751 AND 990 THEN 1 ELSE 0 END), 0) AS brand750_990',
      ])
      .where('ut.createdAt >= :start', { start })
      .andWhere('ut.createdAt < :end', { end })
      .getRawOne<CountUserTestByScoreRaw>();

    return {
      brand0_200: parseInt(result?.brand0_200 || '0', 10),
      brand200_450: parseInt(result?.brand200_450 || '0', 10),
      brand450_750: parseInt(result?.brand450_750 || '0', 10),
      brand750_990: parseInt(result?.brand750_990 || '0', 10),
    };
  }

  async getActivityTrend(
    from: Date,
    to: Date,
  ): Promise<{
    totalSubmissions: number;
    points: Array<{ date: string; submissions: number }>;
  }> {
    const rawResults = await this.userTestRepository
      .createQueryBuilder('ut')
      .select('DATE(ut.createdAt)', 'date')
      .addSelect('COUNT(ut.id)', 'count')
      .where('ut.createdAt >= :start', { start: from })
      .andWhere('ut.createdAt < :end', { end: to })
      .groupBy('DATE(ut.createdAt)')
      .orderBy('DATE(ut.createdAt)', 'ASC')
      .getRawMany<SubmissionByDateRaw>();

    // Map raw results to ActivityPointResponse
    const submissionsByDate = new Map<string, number>();
    rawResults.forEach((row) => {
      const dateStr = row.date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      submissionsByDate.set(dateStr, parseInt(row.count || '0', 10));
    });

    // Fill in all dates in range
    const points: Array<{ date: string; submissions: number }> = [];
    const current = new Date(from);
    current.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setDate(end.getDate() - 1);
    end.setHours(0, 0, 0, 0);

    let totalSubmissions = 0;
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const count = submissionsByDate.get(dateStr) || 0;
      totalSubmissions += count;
      points.push({
        date: dateStr,
        submissions: count,
      });
      current.setDate(current.getDate() + 1);
    }

    return {
      totalSubmissions,
      points,
    };
  }

  async getScoreInsight(
    start: Date,
    end: Date,
  ): Promise<{
    brand0_200: number;
    brand200_450: number;
    brand450_750: number;
    brand750_990: number;
  }> {
    const distInsight = await this.countUserTestByScore(start, end);
    const total =
      distInsight.brand0_200 +
      distInsight.brand200_450 +
      distInsight.brand450_750 +
      distInsight.brand750_990;

    if (total === 0) {
      return distInsight;
    }

    return {
      brand0_200: Math.round((distInsight.brand0_200 / total) * 100),
      brand200_450: Math.round((distInsight.brand200_450 / total) * 100),
      brand450_750: Math.round((distInsight.brand450_750 / total) * 100),
      brand750_990: Math.round((distInsight.brand750_990 / total) * 100),
    };
  }

  async getTestModeInsight(
    start: Date,
    end: Date,
  ): Promise<{ fullTest: number; pratice: number }> {
    const testMode = await this.countUserTestByMode(start, end);
    const sum = testMode.fullTest + testMode.pratice;

    if (sum === 0) {
      return testMode;
    }

    return {
      fullTest: Math.round((testMode.fullTest / sum) * 100),
      pratice: Math.round((testMode.pratice / sum) * 100),
    };
  }
}
