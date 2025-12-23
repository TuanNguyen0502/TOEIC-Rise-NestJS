import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { QuestionGroupMapper } from './mapper/question-group.mapper';
import { Test } from 'src/entities/test.entity';
import { Part } from 'src/entities/part.entity';
import { QuestionExcelRequestDto } from 'src/test/dto/question-excel-request.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { QuestionGroupResponseDto } from './dto/question-group-response.dto';
import { QuestionGroupUpdateRequestDto } from './dto/question-group-update-request.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ETestStatus } from 'src/enums/ETestStatus.enum';

@Injectable()
export class QuestionGroupService {
  constructor(
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepo: Repository<QuestionGroup>,
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
    private readonly mapper: QuestionGroupMapper,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createQuestionGroup(
    test: Test,
    part: Part,
    excelRequest: QuestionExcelRequestDto,
  ): Promise<QuestionGroup> {
    const questionGroup = this.mapper.toQuestionGroup(test, part, excelRequest);

    return await this.questionGroupRepo.save(questionGroup);
    // save() của TypeORM = save + flush
  }

  async getQuestionGroup(id: number): Promise<QuestionGroup | null> {
    // TypeORM findOne() trả về entity | null
    return await this.questionGroupRepo.findOne({
      where: { id },
      relations: ['part', 'questions'],
    });
  }

  async getQuestionGroupAsc(id: number): Promise<QuestionGroup[]> {
    const groups = await this.questionGroupRepo.find({
      where: { test: { id: id } },
      relations: ['part', 'questions', 'questions.tags'],
      order: {
        part: { id: 'ASC' }, // Order by part
        position: 'ASC', // Then by group position
        questions: { position: 'ASC' }, // Then by question position
      },
    });
    if (groups == null) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'QuestionGroup');
    }
    return groups;
  }

  async checkQuestionGroupsExistByIds(ids: number[]) {
    const groups = await this.questionGroupRepo.find({
      where: { id: In(ids) },
      select: ['id'],
    });
    const existing = groups.map((g) => g.id);
    for (const id of ids) {
      if (!existing.includes(id)) {
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question group');
      }
    }
  }

  async findAllByIdInFetchQuestions(ids: number[]): Promise<QuestionGroup[]> {
    const qg = await this.questionGroupRepo
      .createQueryBuilder('qg')
      .leftJoinAndSelect('qg.part', 'part') // <- đảm bảo part được load
      .leftJoinAndSelect('qg.questions', 'questions')
      .where('qg.id IN (:...ids)', { ids })
      .getMany();
    return qg;
  }

  isListeningPart(part: Part): boolean {
    return ['1', '2', '3', '4'].some((p) => part.name.includes(p));
  }

  async getQuestionGroupsByTestIdGroupByParts(
    testId: number,
    partIds: number[],
  ): Promise<Array<{ part: Part; groups: QuestionGroup[] }>> {
    // If no parts filter is provided, load all parts of the test
    const whereClause =
      partIds && partIds.length > 0
        ? { test: { id: testId }, part: { id: In(partIds) } }
        : { test: { id: testId } };

    const questionGroups = await this.questionGroupRepo.find({
      where: whereClause,
      relations: ['part', 'questions', 'questions.tags'],
      order: {
        position: 'ASC',
        questions: { position: 'ASC' },
      },
    });

    // Group by Part
    const groupedByPart = new Map<
      number,
      { part: Part; groups: QuestionGroup[] }
    >();
    questionGroups.forEach((group) => {
      const part = group.part;
      if (!groupedByPart.has(part.id)) {
        groupedByPart.set(part.id, { part, groups: [] });
      }
      groupedByPart.get(part.id)!.groups.push(group);
    });

    return Array.from(groupedByPart.values());
  }

  async getPartNameByQuestionGroupId(questionGroupId: number): Promise<string> {
    const questionGroup = await this.questionGroupRepo.findOne({
      where: { id: questionGroupId },
      relations: ['part'],
    });

    if (!questionGroup) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Question group with ID ${questionGroupId}`,
      );
    }

    return questionGroup.part.name;
  }

  async getPartNamesByQuestionGroupIds(
    questionGroupIds: Set<number>,
  ): Promise<Map<number, string>> {
    const groups = await this.questionGroupRepo
      .createQueryBuilder('qg')
      .leftJoinAndSelect('qg.part', 'part')
      .select(['qg.id', 'part.name'])
      .where('qg.id IN (:...ids)', { ids: [...questionGroupIds] })
      .getMany();
    return new Map(groups.map((qg) => [qg.id, qg.part.name]));
  }

  async findAllByIdsWithQuestions(ids: Set<number>): Promise<QuestionGroup[]> {
    return this.questionGroupRepo
      .createQueryBuilder('qg')
      .leftJoinAndSelect('qg.part', 'part')
      .leftJoinAndSelect('qg.questions', 'questions')
      .where('qg.id IN (:...ids)', { ids: [...ids] })
      .getMany();
  }

  async getQuestionGroupResponse(
    id: number,
  ): Promise<QuestionGroupResponseDto> {
    const questionGroup = await this.questionGroupRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.tags'], // Load câu hỏi và tags của câu hỏi
      order: {
        questions: {
          position: 'ASC', // Sắp xếp câu hỏi theo thứ tự giống logic Java
        },
      },
    });

    if (!questionGroup) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Question group with ID ${id}`,
      );
    }

    return this.mapper.toResponse(questionGroup);
  }

  async updateQuestionGroup(
    id: number,
    dto: QuestionGroupUpdateRequestDto,
    files: { audio?: Express.Multer.File[]; image?: Express.Multer.File[] },
  ): Promise<void> {
    const questionGroup = await this.questionGroupRepo.findOne({
      where: { id },
      relations: ['part', 'test'],
    });

    if (!questionGroup) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Question group ${id}`,
      );
    }

    const part = questionGroup.part;
    const audioFile = files.audio ? files.audio[0] : null;
    const imageFile = files.image ? files.image[0] : null;

    // 1. Validate logic theo từng Part (Giống Java)
    this.validateAudioForPart(part, audioFile, dto.audioUrl);
    this.validateImageForPart(part, imageFile, dto.imageUrl);
    this.validatePassageForPart(part, dto.passage);

    // 2. Xử lý file media (Upload/Delete Cloudinary)
    const newAudioUrl = await this.processMediaFile(
      audioFile,
      dto.audioUrl,
      questionGroup.audioUrl,
      'audio',
    );
    const newImageUrl = await this.processMediaFile(
      imageFile,
      dto.imageUrl,
      questionGroup.imageUrl,
      'image',
    );

    // 3. Cập nhật thông tin
    questionGroup.audioUrl = (newAudioUrl ?? undefined) as string;
    questionGroup.imageUrl = (newImageUrl ?? undefined) as string;
    questionGroup.passage = dto.passage;
    questionGroup.transcript = dto.transcript;

    await this.questionGroupRepo.save(questionGroup);

    // 4. Update trạng thái Test về PENDING (nếu chưa phải)
    await this.changeTestStatusToPending(questionGroup.test);
  }

  private async processMediaFile(
    newFile: Express.Multer.File | null,
    newUrl: string | undefined,
    oldUrl: string | null | undefined,
    type: 'image' | 'audio', // Helper để biết loại file upload
  ): Promise<string | null> {
    const hasFile = !!newFile;
    const hasUrl = !!newUrl;

    if (hasFile) {
      // Nếu có file cũ trên Cloudinary -> Xóa đi để tiết kiệm (hoặc update đè)
      if (oldUrl && this.isCloudinaryUrl(oldUrl)) {
        await this.cloudinaryService.deleteFile(oldUrl);
      }
      // Upload file mới
      return await this.cloudinaryService.uploadFile(newFile);
    }

    if (hasUrl) {
      // Nếu user gửi URL mới khác URL cũ -> Xóa file cũ trên cloud
      if (oldUrl && this.isCloudinaryUrl(oldUrl) && oldUrl !== newUrl) {
        await this.cloudinaryService.deleteFile(oldUrl);
      }
      return newUrl;
    }

    // Nếu không có file mới cũng không có URL mới -> Xóa file cũ (xóa trắng)
    if (oldUrl && this.isCloudinaryUrl(oldUrl)) {
      await this.cloudinaryService.deleteFile(oldUrl);
    }
    return null;
  }

  private validateAudioForPart(
    part: Part,
    file: Express.Multer.File | null,
    url?: string,
  ) {
    const isListening = this.isListeningPart(part);
    const hasAudio = !!file || !!url;

    if (!isListening && hasAudio) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Audio should not be provided for non-listening parts.',
      );
    }
    if (isListening && !hasAudio) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Audio is required for listening parts.',
      );
    }
    // Validate file size nếu cần (thường cấu hình ở MulterOptions rồi)
  }

  private validateImageForPart(
    part: Part,
    file: Express.Multer.File | null,
    url?: string,
  ) {
    const hasImage = !!file || !!url;

    // Part 1 bắt buộc có ảnh
    if (part.name.includes('1') && !hasImage) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        `Image is required for part ${part.name}.`,
      );
    }

    // Part 2, 3, 5, 6 không được có ảnh
    const noImageParts = ['2', '3', '5', '6'];
    const isNoImagePart = noImageParts.some((p) => part.name.includes(p));

    if (isNoImagePart && hasImage) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        `Image should not be provided for part ${part.name}.`,
      );
    }
  }

  private validatePassageForPart(part: Part, passage?: string) {
    const isReadingPassage = part.name.includes('6') || part.name.includes('7');

    if (isReadingPassage && (!passage || passage.trim() === '')) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Passage is required for parts 6 and 7.',
      );
    }
    if (!isReadingPassage && passage && passage.trim() !== '') {
      // Tùy logic, bên Java đang throw lỗi nếu part khác mà có passage
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Passage should not be provided for this part.',
      );
    }
  }

  private async changeTestStatusToPending(test: Test) {
    if (test.status !== ETestStatus.PENDING) {
      test.status = ETestStatus.PENDING;
      await this.testRepo.save(test);
    }
  }

  private isCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com');
  }
}
