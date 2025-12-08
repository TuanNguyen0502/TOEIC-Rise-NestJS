import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTest } from 'src/entities/user-test.entity';
import { ETestStatus } from 'src/enums/ETestStatus.enum';
import { TestHistoryResponse } from './dto/test-history-response.dto';
import { PageResponse, PageMeta } from 'src/test-set/dto/page-response.dto';
import { IAnalysisService } from './analysis.service.interface';
import { formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE_VIETNAM } from 'src/common/constants/constants';

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

  async getDailyAnalysis(): Promise<void> {}

  async getFullTestResult(): Promise<void> {}
}
