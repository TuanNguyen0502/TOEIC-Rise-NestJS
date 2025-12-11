import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTest } from 'src/entities/user-test.entity';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { Question } from 'src/entities/question.entity';
import { ETestStatus } from 'src/enums/ETestStatus.enum';
import { EDays, getDaysValue } from 'src/enums/EDays.enum';
import { TestHistoryResponse } from './dto/test-history-response.dto';
import { FullTestResultResponse } from './dto/full-test-result-response.dto';
import { ExamTypeFullTestResponse } from './dto/exam-type-full-test-response.dto';
import { AnalysisResultResponse } from './dto/analysis-result-response.dto';
import { ExamTypeStatsResponse } from './dto/exam-type-stats-response.dto';
import { UserAnswerGroupedByTagResponse } from './dto/user-answer-grouped-by-tag-response.dto';
import { PageResponse, PageMeta } from 'src/test-set/dto/page-response.dto';
import { IAnalysisService } from './analysis.service.interface';
import { QuestionGroupService } from 'src/question-group/question-group.service';
import { formatInTimeZone } from 'date-fns-tz';
import {
  DATE_TIME_PATTERN,
  TIMEZONE_VIETNAM,
} from 'src/common/constants/constants';

type AnalysisRawRow = {
  id: string | number;
  name: string;
  createdAt: Date | string | null;
  parts: string | null;
  correctAnswers: string | number;
  totalQuestions: string | number;
  totalScore: string | number | null;
  timeSpent: string | number;
};

@Injectable()
export class AnalysisService implements IAnalysisService {
  constructor(
    @InjectRepository(UserTest)
    private readonly userTestRepository: Repository<UserTest>,
    @InjectRepository(UserAnswer)
    private readonly userAnswerRepository: Repository<UserAnswer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly questionGroupService: QuestionGroupService,
  ) {}

  async getAllTestHistory(
    page: number,
    size: number,
    email: string,
  ): Promise<PageResponse<TestHistoryResponse[]>> {
    const queryBuilder = this.userTestRepository
      .createQueryBuilder('ut')
      .innerJoin('ut.user', 'u')
      .innerJoin('u.account', 'a')
      .innerJoin('ut.test', 't')
      .where('a.email = :email', { email })
      .andWhere('t.status = :status', { status: ETestStatus.APPROVED })
      .select([
        'ut.id AS id',
        't.name AS name',
        'ut.createdAt AS createdAt',
        'ut.parts AS parts',
        'ut.correctAnswers AS correctAnswers',
        'ut.totalQuestions AS totalQuestions',
        'ut.totalScore AS totalScore',
        'ut.timeSpent AS timeSpent',
      ])
      .orderBy('ut.createdAt', 'DESC');

    const total = await this.userTestRepository
      .createQueryBuilder('ut')
      .innerJoin('ut.user', 'u')
      .innerJoin('u.account', 'a')
      .innerJoin('ut.test', 't')
      .where('a.email = :email', { email })
      .andWhere('t.status = :status', { status: ETestStatus.APPROVED })
      .getCount();

    const rows = await queryBuilder
      .limit(size)
      .offset(page * size)
      .getRawMany<AnalysisRawRow>();

    // Format results
    const result: TestHistoryResponse[] = rows.map((row) => {
      let parts: string[] | null = null;

      if (row.parts) {
        if (Array.isArray(row.parts)) {
          parts = row.parts;
        } else if (typeof row.parts === 'string') {
          try {
            const parsed: unknown = JSON.parse(row.parts);
            parts = Array.isArray(parsed) ? (parsed as string[]) : null;
          } catch {
            parts = row.parts.split(', ').filter((p: string) => p.trim());
          }
        }
      }

      return {
        id: Number(row.id),
        name: row.name,
        createdAt: row.createdAt
          ? formatInTimeZone(row.createdAt, TIMEZONE_VIETNAM, 'yyyy-MM-dd')
          : null,
        parts,
        correctAnswers: Number(row.correctAnswers),
        totalQuestions: Number(row.totalQuestions),
        totalScore: row.totalScore ? Number(row.totalScore) : null,
        timeSpent: Number(row.timeSpent),
      };
    });

    // Calculate number of pages
    const pages = Math.ceil(total / size);

    const meta: PageMeta = {
      page,
      pageSize: size,
      pages,
      total,
    };

    return {
      meta,
      result,
    };
  }

  async getFullTestResult(
    email: string,
    size: number,
  ): Promise<FullTestResultResponse> {
    // Limit size to max 10
    if (size > 10) {
      size = 10;
    }

    // Find user tests with totalScore not null, ordered by createdAt DESC
    const userTests = await this.userTestRepository
      .createQueryBuilder('ut')
      .innerJoin('ut.user', 'u')
      .innerJoin('u.account', 'a')
      .innerJoin('ut.test', 't')
      .where('a.email = :email', { email })
      .andWhere('ut.totalScore IS NOT NULL')
      .andWhere('t.status = :status', { status: ETestStatus.APPROVED })
      .select([
        'ut.id',
        'ut.createdAt',
        'ut.totalScore',
        'ut.listeningScore',
        'ut.readingScore',
        't.id',
        't.name',
      ])
      .orderBy('ut.createdAt', 'DESC')
      .limit(size)
      .getMany();

    const scores: number[] = [];
    const listeningScores: number[] = [];
    const readingScores: number[] = [];
    const examTypeFullTestResponses: ExamTypeFullTestResponse[] = [];

    for (const ut of userTests) {
      if (ut.totalScore) scores.push(ut.totalScore);
      if (ut.listeningScore) listeningScores.push(ut.listeningScore);
      if (ut.readingScore) readingScores.push(ut.readingScore);

      examTypeFullTestResponses.push({
        id: ut.id,
        name: ut.test.name,
        createdAt: formatInTimeZone(
          ut.createdAt,
          TIMEZONE_VIETNAM,
          DATE_TIME_PATTERN,
        ),
        listeningScore: ut.listeningScore || 0,
        readingScore: ut.readingScore || 0,
        totalScore: ut.totalScore || 0,
      });
    }

    // Calculate averages and max values
    const averageScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const averageListeningScore = listeningScores.length
      ? Math.round(
          listeningScores.reduce((a, b) => a + b, 0) / listeningScores.length,
        )
      : 0;
    const averageReadingScore = readingScores.length
      ? Math.round(
          readingScores.reduce((a, b) => a + b, 0) / readingScores.length,
        )
      : 0;
    const maxListeningScore = listeningScores.length
      ? Math.max(...listeningScores)
      : 0;
    const maxReadingScore = readingScores.length
      ? Math.max(...readingScores)
      : 0;

    return {
      averageScore: this.roundToNearest5(averageScore),
      highestScore,
      averageListeningScore: this.roundToNearest5(averageListeningScore),
      averageReadingScore: this.roundToNearest5(averageReadingScore),
      maxListeningScore,
      maxReadingScore,
      examTypeFullTestResponses,
    };
  }

  private roundToNearest5(number: number): number {
    return Math.round(number / 5) * 5;
  }

  async getAnalysisResult(
    email: string,
    days: EDays,
  ): Promise<AnalysisResultResponse> {
    // Calculate date range
    const daysValue = getDaysValue(days);
    const latestTest = await this.userTestRepository
      .createQueryBuilder('ut')
      .innerJoin('ut.user', 'u')
      .innerJoin('u.account', 'a')
      .where('a.email = :email', { email })
      .orderBy('ut.createdAt', 'DESC')
      .getOne();

    const startDate = latestTest
      ? new Date(
          latestTest.createdAt.getTime() - daysValue * 24 * 60 * 60 * 1000,
        )
      : new Date(Date.now() - daysValue * 24 * 60 * 60 * 1000);

    // Find all user tests with relations
    const userTests = await this.userTestRepository
      .createQueryBuilder('ut')
      .innerJoin('ut.user', 'u')
      .innerJoin('u.account', 'a')
      .leftJoinAndSelect('ut.test', 't')
      .leftJoinAndSelect('ut.userAnswers', 'ua')
      .leftJoinAndSelect('ua.question', 'q')
      .leftJoinAndSelect('q.tags', 'tag')
      .where('a.email = :email', { email })
      .andWhere('ut.createdAt >= :startDate', { startDate })
      .getMany();

    // Count distinct tests
    const distinctTestIds = new Set(
      userTests
        .map((ut) => ut.test?.id)
        .filter((id): id is number => id != null),
    );
    const numberOfTests = distinctTestIds.size;

    // Initialize tracking variables
    const listeningData = new Map<string, Map<string, TagStats>>();
    const readingData = new Map<string, Map<string, TagStats>>();
    const listeningPartStats = new Map<string, PartStats>();
    const readingPartStats = new Map<string, PartStats>();

    let totalSpent = 0;
    let totalQuestionsListening = 0;
    let correctAnswersListening = 0;
    let totalQuestionsReading = 0;
    let correctAnswersReading = 0;

    // Process each user test
    for (const ut of userTests) {
      totalSpent += ut.timeSpent || 0;
      totalQuestionsListening += ut.totalListeningQuestions || 0;
      correctAnswersListening += ut.listeningCorrectAnswers || 0;
      totalQuestionsReading += ut.totalReadingQuestions || 0;
      correctAnswersReading += ut.readingCorrectAnswers || 0;

      if (!ut.userAnswers || ut.userAnswers.length === 0) continue;

      // Get question group IDs - convert to numbers
      const questionGroupIds = [
        ...new Set(
          ut.userAnswers
            .map((ua) => Number(ua.questionGroupId))
            .filter((id) => !isNaN(id)),
        ),
      ];

      // Get part names for question groups
      const partNamesByGroupId =
        await this.questionGroupService.getPartNamesByQuestionGroupIds(
          new Set(questionGroupIds),
        );

      // Group answers by part
      const answersByPart = new Map<string, UserAnswer[]>();
      for (const ua of ut.userAnswers) {
        const groupId = Number(ua.questionGroupId);
        const partName = partNamesByGroupId.get(groupId);
        if (!partName) continue;

        if (!answersByPart.has(partName)) {
          answersByPart.set(partName, []);
        }
        answersByPart.get(partName)!.push(ua);
      }

      // Process each part
      for (const [partName, answersInPart] of answersByPart.entries()) {
        const isListening = this.isListeningPart(partName);
        const examTypeData = isListening ? listeningData : readingData;
        const examTypePartStats = isListening
          ? listeningPartStats
          : readingPartStats;

        if (!examTypeData.has(partName)) {
          examTypeData.set(partName, new Map());
        }
        if (!examTypePartStats.has(partName)) {
          examTypePartStats.set(partName, new PartStats());
        }

        const tagStatsMap = examTypeData.get(partName)!;

        // Group answers by tag
        const answersByTag = new Map<string, UserAnswer[]>();
        for (const ua of answersInPart) {
          if (ua.question?.tags) {
            for (const tag of ua.question.tags) {
              if (!answersByTag.has(tag.name)) {
                answersByTag.set(tag.name, []);
              }
              answersByTag.get(tag.name)!.push(ua);
            }
          }
        }

        // Calculate stats for each tag
        for (const [tagName, answersForTag] of answersByTag.entries()) {
          const correct = answersForTag.filter((ua) => ua.isCorrect).length;
          const wrong = answersForTag.length - correct;

          if (!tagStatsMap.has(tagName)) {
            tagStatsMap.set(tagName, new TagStats());
          }
          tagStatsMap.get(tagName)!.add(correct, wrong);
        }

        // Calculate part stats
        const partCorrect = answersInPart.filter((ua) => ua.isCorrect).length;
        const partWrong = answersInPart.length - partCorrect;
        examTypePartStats.get(partName)!.add(partCorrect, partWrong);
      }
    }

    // Build responses
    const listening = this.buildExamTypeStatsResponse(
      totalQuestionsListening,
      correctAnswersListening,
      listeningData,
      listeningPartStats,
    );

    const reading = this.buildExamTypeStatsResponse(
      totalQuestionsReading,
      correctAnswersReading,
      readingData,
      readingPartStats,
    );

    return {
      numberOfTests,
      numberOfSubmissions: userTests.length,
      totalTimes: totalSpent,
      examList: [listening, reading],
    };
  }

  private isListeningPart(partName: string): boolean {
    return (
      partName != null &&
      (partName.includes('1') ||
        partName.includes('2') ||
        partName.includes('3') ||
        partName.includes('4'))
    );
  }

  private buildExamTypeStatsResponse(
    totalQuestions: number,
    totalCorrectAnswers: number,
    rawData: Map<string, Map<string, TagStats>>,
    partStats: Map<string, PartStats>,
  ): ExamTypeStatsResponse {
    const userAnswersByPart: Record<string, UserAnswerGroupedByTagResponse[]> =
      {};

    for (const [partName, tagStatsMap] of rawData.entries()) {
      const responses: UserAnswerGroupedByTagResponse[] = [];

      for (const [tagName, stats] of tagStatsMap.entries()) {
        const total = stats.correct + stats.wrong;
        const correctPercent = total === 0 ? 0 : (stats.correct / total) * 100;

        responses.push({
          tag: tagName,
          correctAnswers: stats.correct,
          wrongAnswers: stats.wrong,
          correctPercent,
        });
      }

      // Add total for this part
      const partStat = partStats.get(partName);
      if (partStat) {
        const partTotal = partStat.correct + partStat.wrong;
        const partCorrectPercent =
          partTotal === 0 ? 0 : (partStat.correct / partTotal) * 100;

        responses.push({
          tag: 'Total',
          correctAnswers: partStat.correct,
          wrongAnswers: partStat.wrong,
          correctPercent: partCorrectPercent,
        });
      }

      userAnswersByPart[partName] = responses;
    }

    const correctPercent =
      totalQuestions === 0 ? 0 : (totalCorrectAnswers / totalQuestions) * 100;

    return {
      totalQuestions,
      totalCorrectAnswers,
      correctPercent,
      userAnswersByPart,
    };
  }

  async getDailyAnalysis(): Promise<void> {}
}

class TagStats {
  correct = 0;
  wrong = 0;

  add(correctDelta: number, wrongDelta: number): void {
    this.correct += correctDelta;
    this.wrong += wrongDelta;
  }
}

class PartStats {
  correct = 0;
  wrong = 0;

  add(correctDelta: number, wrongDelta: number): void {
    this.correct += correctDelta;
    this.wrong += wrongDelta;
  }
}
