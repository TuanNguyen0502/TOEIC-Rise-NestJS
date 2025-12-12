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
    // Fallback to relation-based group id in case questionGroupId column is null/not populated
    const questionGroupIds = userAnswers.map(
      (ua) => ua.questionGroupId ?? ua.question?.questionGroup?.id,
    );
    // Lọc bỏ null/undefined và tạo Set
    const validQuestionGroupIds = new Set<number>(
      questionGroupIds.filter(
        (id): id is number => id !== null && id !== undefined,
      ),
    );
    const partNamesByGroupId =
      validQuestionGroupIds.size > 0
        ? await this.questionGroupService.getPartNamesByQuestionGroupIds(
            validQuestionGroupIds,
          )
        : new Map<number, string>();

    // group answers by part name
    const answersByPart = new Map<string, any[]>();
    for (const ua of userAnswers) {
      const groupId = ua.questionGroupId ?? ua.question?.questionGroup?.id;
      if (!groupId) continue;
      const partName = partNamesByGroupId.get(groupId);
      const finalPartName = partName ?? 'Unknown';
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

      groupedResponses.push({
        tag: 'Total',
        correctAnswers: totalCorrect,
        wrongAnswers: totalWrong,
        correctPercent: totalPercent,
        userAnswerOverallResponses: null,
      });

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

    test.numberOfLearnerTests = (test.numberOfLearnerTests ?? 0) + 1;
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
}
