import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTest } from 'src/entities/user-test.entity';
import { ETestStatus } from 'src/enums/ETestStatus.enum';
import { TestHistoryResponse } from './dto/test-history-response.dto';
import { FullTestResultResponse } from './dto/full-test-result-response.dto';
import { ExamTypeFullTestResponse } from './dto/exam-type-full-test-response.dto';
import { PageResponse, PageMeta } from 'src/test-set/dto/page-response.dto';
import { IAnalysisService } from './analysis.service.interface';
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

  async getDailyAnalysis(): Promise<void> {}
}
