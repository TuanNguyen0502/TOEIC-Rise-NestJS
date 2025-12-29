import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { QuestionReport } from 'src/entities/question-report.entity';
import { User } from 'src/entities/user.entity';
import { Question } from 'src/entities/question.entity';
import { GetQuestionReportsQueryDto } from './dto/get-question-reports-query.dto';
import { QuestionReportResponseDto } from './dto/question-report-response.dto';
import { PageResponse } from './dto/page-response.dto';
import { EQuestionReportStatus } from 'src/enums/EQuestionReportStatus.enum';
import { QuestionReportDetailResponseDto } from './dto/question-report-detail-response.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { QuestionService } from 'src/question/question.service';
import { QuestionGroupService } from 'src/question-group/question-group.service';
import { ResolveQuestionReportDto } from './dto/resolve-question-report.dto';
import { ERole } from 'src/enums/ERole.enum';

@Injectable()
export class QuestionReportService {
  constructor(
    @InjectRepository(QuestionReport)
    private readonly questionReportRepo: Repository<QuestionReport>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    private readonly questionService: QuestionService,
    private readonly questionGroupService: QuestionGroupService,
  ) {}

  async createReport(
    email: string,
    dto: { questionId: number; reasons: any[]; description?: string },
  ): Promise<void> {
    const reporter = await this.userRepo.findOne({
      where: { account: { email } },
      relations: ['account'],
    });
    if (!reporter) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    const question = await this.questionRepo.findOne({
      where: { id: dto.questionId },
    });
    if (!question) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');
    }

    const report = this.questionReportRepo.create({
      question,
      reporter,
      reasons: dto.reasons as any,
      description: dto.description,
      status: EQuestionReportStatus.PENDING,
    });

    await this.questionReportRepo.save(report);
  }

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

    // 2. Tìm Resolver (User hiện tại)
    const resolver = await this.userRepo.findOne({
      where: { account: { email } },
      relations: ['role'],
    });

    if (!resolver) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User not found');
    }

    this.checkStaffPermission(resolver, report);

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

  async resolveReport(
    reportId: number,
    email: string,
    dto: ResolveQuestionReportDto,
    files: { audio?: Express.Multer.File[]; image?: Express.Multer.File[] },
  ): Promise<void> {
    // 1. Tìm Report
    const report = await this.questionReportRepo.findOne({
      where: { id: reportId },
      relations: [
        'question',
        'question.questionGroup',
        'resolver',
        'resolver.account',
      ],
    });
    if (!report)
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question Report');

    // 2. Tìm Resolver (User hiện tại)
    const resolver = await this.userRepo.findOne({
      where: { account: { email } },
      relations: ['role'],
    });

    if (!resolver) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User not found');
    }

    this.checkStaffPermission(resolver, report);

    // 4. Update Question (Nếu có request)
    if (dto.questionUpdate) {
      // Đảm bảo ID khớp với report
      if (dto.questionUpdate.id !== report.question.id) {
        throw new AppException(
          ErrorCode.INVALID_REQUEST,
          'Question ID mismatch',
        );
      }
      await this.questionService.updateQuestionFromReport(dto.questionUpdate);
    }

    // 5. Update Group (Nếu có request)
    if (dto.questionGroupUpdate) {
      await this.questionGroupService.updateQuestionGroup(
        report.question.questionGroup.id, // Lấy ID group từ question hiện tại
        dto.questionGroupUpdate,
        files,
      );
    }

    // 6. Update Report Status
    report.resolver = resolver;
    report.status = dto.status;
    report.resolvedNote = dto.resolvedNote;

    await this.questionReportRepo.save(report);
  }

  private checkStaffPermission(
    currentUser: User,
    questionReport: QuestionReport,
  ): void {
    // 1. Kiểm tra xem user có phải là STAFF không
    // Lưu ý: Cần đảm bảo currentUser đã được query kèm relation 'role'
    if (currentUser.role?.name === ERole.STAFF) {
      // 2. Nếu Report đã có người giải quyết (resolver khác null)
      if (questionReport.resolver) {
        // Thì người giải quyết phải là chính Staff đó
        if (questionReport.resolver.id !== currentUser.id) {
          throw new AppException(
            ErrorCode.UNAUTHORIZED, // Hoặc FORBIDDEN tùy theo Enum bạn định nghĩa
            'You are not authorized to access this report assigned to another staff',
          );
        }
      }
      // 3. Nếu chưa có người giải quyết, thì trạng thái phải là PENDING
      else if (questionReport.status !== EQuestionReportStatus.PENDING) {
        throw new AppException(
          ErrorCode.UNAUTHORIZED,
          'Staff can only access pending reports if not assigned',
        );
      }
    }
  }

  async totalReports(): Promise<number> {
    return this.questionReportRepo.count();
  }
}
