import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTest } from 'src/entities/user-test.entity';
import { LearnerTestHistoryResponse } from './dto/learner-test-history-response.dto';
import { formatInTimeZone } from 'date-fns-tz';
import {
  DATE_TIME_PATTERN,
  TIMEZONE_VIETNAM,
} from 'src/common/constants/constants';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { Test } from 'src/entities/test.entity';
import { QuestionGroupService } from 'src/question-group/question-group.service';
import { TestExcelMapper } from 'src/test/mapper/test.mapper';
import { PartMapper } from 'src/part/mapper/part.mapper';
import { QuestionGroupMapper } from 'src/question-group/mapper/question-group.mapper';
import { UserAnswerMapper } from 'src/user-answer/mapper/user-answer.mapper';
import { LearnerTestPartResponse } from './dto/learner-test-part-response.dto';
import { QuestionMapper } from 'src/question/mapper/question.mapper';
import { LearnerTestQuestionResponse } from './dto/learner-test-question-response.dto';
import { LearnerTestPartsResponse } from './dto/learner-test-parts-response.dto';
import { ETestStatus } from 'src/enums/ETestStatus.enum';
import { UserAnswerOverallResponse } from './dto/user-answer-overall-response.dto';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { Part } from 'src/entities/part.entity';

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
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    private readonly questionGroupService: QuestionGroupService,
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
}
