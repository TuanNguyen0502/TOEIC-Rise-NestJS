import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { QuestionReport } from 'src/entities/question-report.entity';
import { GetQuestionReportsQueryDto } from './dto/get-question-reports-query.dto';
import { QuestionReportResponseDto } from './dto/question-report-response.dto';
import { PageResponse } from './dto/page-response.dto';
import { EQuestionReportStatus } from 'src/enums/EQuestionReportStatus.enum';

@Injectable()
export class QuestionReportService {
  constructor(
    @InjectRepository(QuestionReport)
    private readonly questionReportRepo: Repository<QuestionReport>,
  ) {}

  async getAllReports(
    query: GetQuestionReportsQueryDto,
  ): Promise<PageResponse<QuestionReportResponseDto>> {
    const { questionReportStatus, size = 10 } = query;
    let { page = 1 } = query;
    if (page < 1) page = 1;

    const skip = (page - 1) * size;

    // 1. Tạo QueryBuilder và Join các bảng
    const qb = this.questionReportRepo
      .createQueryBuilder('qr')
      .leftJoinAndSelect('qr.question', 'question')
      .leftJoinAndSelect('question.questionGroup', 'qg')
      .leftJoinAndSelect('qg.test', 'test') // Để lấy tên bài thi (Test Name)
      .leftJoinAndSelect('qr.reporter', 'reporter')
      .leftJoinAndSelect('qr.resolver', 'resolver');

    // 2. Lọc theo trạng thái (nếu có)
    if (questionReportStatus) {
      qb.where('qr.status = :status', { status: questionReportStatus });
    }

    // 3. Sắp xếp: Mới nhất lên đầu
    qb.orderBy('qr.createdAt', 'DESC');

    // 4. Phân trang
    qb.skip(skip).take(size);

    // 5. Thực thi
    const [reports, total] = await qb.getManyAndCount();

    // 6. Map dữ liệu sang DTO
    const content = reports.map((report) => this.mapToResponse(report));

    return new PageResponse(content, page, size, total);
  }

  private mapToResponse(report: QuestionReport): QuestionReportResponseDto {
    return {
      id: report.id,
      testName: report.question?.questionGroup?.test?.name || 'Unknown Test',
      reporterName: report.reporter?.fullName || 'Unknown Reporter',
      resolverName: report.resolver?.fullName || '',
      status: report.status,
      reasons: report.reasons || [],
    };
  }

  async getStaffReports(
    email: string, // Nhận vào email
    query: GetQuestionReportsQueryDto,
  ): Promise<PageResponse<QuestionReportResponseDto>> {
    const { size = 10 } = query;
    let { page = 1 } = query;
    if (page < 1) page = 1;

    const skip = (page - 1) * size;

    const qb = this.questionReportRepo
      .createQueryBuilder('qr')
      .leftJoinAndSelect('qr.question', 'question')
      .leftJoinAndSelect('question.questionGroup', 'qg')
      .leftJoinAndSelect('qg.test', 'test')
      .leftJoinAndSelect('qr.reporter', 'reporter')
      .leftJoinAndSelect('qr.resolver', 'resolver')
      .leftJoinAndSelect('resolver.account', 'resolverAccount'); 

    qb.where(
      new Brackets((qb) => {
        // Sử dụng Alias 'resolverAccount' để lọc email
        qb.where('resolverAccount.email = :email', { email })
          .orWhere('qr.status = :status', {
            status: EQuestionReportStatus.PENDING,
          });
      }),
    );

    // 3. Sort & Paging
    qb.orderBy('qr.createdAt', 'DESC');
    qb.skip(skip).take(size);

    // 4. Exec
    const [reports, total] = await qb.getManyAndCount();
    const content = reports.map((report) => this.mapToResponse(report));

    return new PageResponse(content, page, size, total);
  }
}
