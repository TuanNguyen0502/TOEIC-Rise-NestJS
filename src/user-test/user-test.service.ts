// src/test/test.service.ts
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
}
