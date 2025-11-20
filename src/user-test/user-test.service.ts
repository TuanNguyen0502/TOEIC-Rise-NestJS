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
  TIMEZONE_VIETNAM,
} from 'src/common/constants/constants';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

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

  async getUserTestResultById(
    email: string,
    userTestId: number,
  ): Promise<TestResultResponseDto> {
    // 1. Fetch UserTest with deep relations to traverse: Answer -> Question -> Group -> Part
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
        'userAnswers.question.questionGroup.part',
      ],
    });

    if (!userTest) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'UserTest');
    }

    // 2. Security Check
    if (userTest.user.account.email !== email) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Test Result');
    }

    const userAnswers = userTest.userAnswers;
    const userAnswersByPart: Record<
      string,
      UserAnswerGroupedByTagResponseDto[]
    > = {};

    // 3. Group answers by Part Name
    const answersByPartMap = new Map<string, UserAnswer[]>();

    for (const answer of userAnswers) {
      const partName = answer.question.questionGroup.part.name; // Direct access via relations
      if (!answersByPartMap.has(partName)) {
        answersByPartMap.set(partName, []);
      }
      answersByPartMap.get(partName)!.push(answer);
    }

    // 4. Process each Part
    for (const [partName, answersInPart] of answersByPartMap.entries()) {
      const groupedResponses: UserAnswerGroupedByTagResponseDto[] = [];

      // 4a. Group by Tag within the Part
      const answersByTagMap = new Map<string, UserAnswer[]>();

      for (const answer of answersInPart) {
        const tags = answer.question.tags;
        if (tags) {
          for (const tag of tags) {
            if (!answersByTagMap.has(tag.name)) {
              answersByTagMap.set(tag.name, []);
            }
            answersByTagMap.get(tag.name)!.push(answer);
          }
        }
      }

      // 4b. Calculate stats for each Tag
      for (const [tagName, answersForTag] of answersByTagMap.entries()) {
        const correctCount = answersForTag.filter((a) => a.isCorrect).length;
        const totalCount = answersForTag.length;
        const wrongCount = totalCount - correctCount;
        const correctPercent =
          totalCount === 0 ? 0 : (correctCount / totalCount) * 100;

        groupedResponses.push({
          tag: tagName,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          correctPercent: parseFloat(correctPercent.toFixed(2)), // Clean formatting
          userAnswerOverallResponses: answersForTag.map((a) => ({
            questionId: a.question.id,
            userAnswer: a.answer ?? null,
            isCorrect: a.isCorrect,
            correctOption: a.question.correctOption,
          })),
        });
      }

      // 4c. Add "Total" summary for the Part
      const totalCorrectPart = answersInPart.filter((a) => a.isCorrect).length;
      const totalQuestionsPart = answersInPart.length;
      const totalWrongPart = totalQuestionsPart - totalCorrectPart;
      const totalPercentPart =
        totalQuestionsPart === 0
          ? 0
          : (totalCorrectPart / totalQuestionsPart) * 100;

      groupedResponses.push({
        tag: 'Total',
        correctAnswers: totalCorrectPart,
        wrongAnswers: totalWrongPart,
        correctPercent: parseFloat(totalPercentPart.toFixed(2)),
        userAnswerOverallResponses: undefined, // Java sets this to null for Total
      });

      // Assign to result map
      userAnswersByPart[partName] = groupedResponses;
    }

    // 5. Construct Final Response
    return {
      id: userTest.id,
      testName: userTest.test.name,
      totalScore: userTest.totalScore ?? Number.NaN,
      readingScore: userTest.readingScore ?? Number.NaN,
      listeningScore: userTest.listeningScore ?? Number.NaN,
      correctAnswers: userTest.correctAnswers ?? Number.NaN,
      totalQuestions: userTest.totalQuestions ?? Number.NaN,
      timeSpent: userTest.timeSpent ?? Number.NaN,
      createdAt: userTest.createdAt
        ? formatInTimeZone(
            userTest.createdAt,
            TIMEZONE_VIETNAM,
            DATE_TIME_PATTERN,
          )
        : null,
      userAnswersByPart: userAnswersByPart,
    };
  }
}
