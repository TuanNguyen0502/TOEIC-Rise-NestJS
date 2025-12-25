import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { QuestionReport } from 'src/entities/question-report.entity';
import { User } from 'src/entities/user.entity';
import { GetQuestionReportsQueryDto } from './dto/get-question-reports-query.dto';
import { QuestionReportResponseDto } from './dto/question-report-response.dto';
import { PageResponse } from './dto/page-response.dto';
import { EQuestionReportStatus } from 'src/enums/EQuestionReportStatus.enum';
import { QuestionReportDetailResponseDto } from './dto/question-report-detail-response.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

@Injectable()
export class QuestionReportService {
  constructor(
    @InjectRepository(QuestionReport)
    private readonly questionReportRepo: Repository<QuestionReport>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
        qb.where('resolverAccount.email = :email', { email }).orWhere(
          'qr.status = :status',
          {
            status: EQuestionReportStatus.PENDING,
          },
        );
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

  async getStaffReportDetail(
    reportId: number,
    email: string,
  ): Promise<QuestionReportDetailResponseDto> {
    // 1. Query Data với Relations đầy đủ
    const report = await this.questionReportRepo.findOne({
      where: { id: reportId },
      relations: [
        'question',
        'question.tags', // Join bảng Tags
        'question.questionGroup',
        'question.questionGroup.part', // Join bảng Part
        'reporter',
        'reporter.account', // Join Account để lấy email reporter
        'resolver',
        'resolver.account', // Join Account để lấy email resolver
      ],
    });

    if (!report) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Question report not found',
      );
    }

    // 2. Check quyền Staff (Logic cũ)
    const isStaff = await this.userRepo.findOne({
      where: {
        account: { email },
        role: In(['STAFF']),
      },
    });
    const isPending = report.status === EQuestionReportStatus.PENDING;
    const isAssignedToMe = report.resolver?.account?.email === email;

    if (isStaff && !isPending && !isAssignedToMe) {
      throw new AppException(
        ErrorCode.UNAUTHORIZED,
        'You do not have permission to view this report',
      );
    }

    // 3. Map sang DTO chi tiết
    return this.mapToDetailResponse(report);
  }

  private mapToDetailResponse(
    report: QuestionReport,
  ): QuestionReportDetailResponseDto {
    const question = report.question;
    const group = question?.questionGroup;
    const reporter = report.reporter;
    const resolver = report.resolver;

    return {
      // --- Report Info ---
      questionReportId: report.id,
      reasons: report.reasons || [],
      description: report.description || '',
      status: report.status,
      resolvedNote: report.resolvedNote || '',

      // --- Question Info ---
      questionId: question?.id,
      questionPosition: question?.position,
      questionContent: question?.content || '',
      questionOptions: question?.options || [], // TypeORM transformer đã tự convert JSON -> array
      questionCorrectOption: question?.correctOption || '',
      questionExplanation: question?.explanation || '',
      questionTags: question?.tags?.map((tag) => tag.name) || [], // Map từ Tag Entity -> String array

      // --- Group Info ---
      questionGroupId: group?.id,
      questionGroupAudioUrl: group?.audioUrl || null,
      questionGroupImageUrl: group?.imageUrl || null,
      questionGroupPassage: group?.passage || null,
      questionGroupTranscript: group?.transcript || null,

      // --- Part Info ---
      partName: group?.part?.name || 'Unknown Part',

      // --- Reporter Info ---
      reporterId: reporter?.id,
      reporterFullName: reporter?.fullName || 'Unknown',
      reporterEmail: reporter?.account?.email || '',

      // --- Resolver Info (Có thể null) ---
      resolverId: resolver?.id || null,
      resolverFullName: resolver?.fullName || null,
      resolverEmail: resolver?.account?.email || null,
    };
  }
}
