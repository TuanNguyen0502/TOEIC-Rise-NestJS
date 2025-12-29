import { Inject, Injectable, forwardRef } from '@nestjs/common';
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
import {
  QUESTION_GROUP_AUDIO_MAX_SIZE,
  QUESTION_GROUP_IMAGE_MAX_SIZE,
} from 'src/common/constants/constants';
import { QuestionService } from 'src/question/question.service';

@Injectable()
export class QuestionGroupService {
  constructor(
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepo: Repository<QuestionGroup>,
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
    private readonly mapper: QuestionGroupMapper,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => QuestionService))
    private readonly questionService: QuestionService,
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
    const questionGroup = await this.getQuestionGroup(id);

    if (!questionGroup) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Question group with ID ${id}`,
      );
    }

    // Get questions using QuestionService (corresponds to Java logic)
    const questions = await this.questionService.getQuestionsByQuestionGroupId(
      id,
    );

    return this.mapper.toResponse(questionGroup, questions);
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
    await this.changeTestStatusToPending(questionGroup);
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
    const hasAudioFile = !!file;
    const hasAudioUrl = !!url && url.trim().length > 0;

    // Non-listening parts should not have audio
    if (!isListening && (hasAudioFile || hasAudioUrl)) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Audio should not be provided for non-listening parts.',
      );
    }
    // Listening parts require audio
    if (isListening && !hasAudioFile && !hasAudioUrl) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Audio is required for listening parts.',
      );
    }
    // Validate audio file size
    if (hasAudioFile && file.size > QUESTION_GROUP_AUDIO_MAX_SIZE) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Audio file size exceeds the maximum limit.',
      );
    }
    // Validate audio file and URL
    if (hasAudioFile) {
      this.cloudinaryService.validateAudioFile(file);
    }
    if (hasAudioUrl) {
      this.cloudinaryService.validateAudioURL(url);
    }
  }

  private validateImageForPart(
    part: Part,
    file: Express.Multer.File | null,
    url?: string,
  ) {
    const hasImageFile = !!file;
    const hasImageUrl = !!url && url.trim().length > 0;

    // Part 1 requires an image
    if (part.name.includes('1') && !hasImageFile && !hasImageUrl) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        `Image is required for part ${part.name}.`,
      );
    }
    // Parts 2, 3, 5, and 6 should not have images
    if (
      part.name.includes('2') ||
      part.name.includes('3') ||
      part.name.includes('5') ||
      part.name.includes('6')
    ) {
      if (hasImageFile || hasImageUrl) {
        throw new AppException(
          ErrorCode.INVALID_REQUEST,
          `Image should not be provided for part ${part.name}.`,
        );
      }
    }
    // Validate image file size
    if (hasImageFile && file.size > QUESTION_GROUP_IMAGE_MAX_SIZE) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Image file size exceeds the maximum limit.',
      );
    }
    // Validate image file and URL
    if (hasImageFile) {
      this.cloudinaryService.validateImageFile(file);
    }
    if (hasImageUrl) {
      this.cloudinaryService.validateImageURL(url);
    }
  }

  private validatePassageForPart(part: Part, passage?: string) {
    // Parts 6 and 7 require a passage
    // Other parts should not have a passage
    if (part.name.includes('6') || part.name.includes('7')) {
      if (!passage || passage.trim() === '') {
        throw new AppException(
          ErrorCode.INVALID_REQUEST,
          'Passage is required for parts 6 and 7.',
        );
      }
    } else if (passage && passage.trim() !== '') {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Passage should not be provided for listening parts or part 5.',
      );
    }
  }

  /**
   * Corresponds to: changeTestStatusToPending(questionGroup) - @Async method in Java
   * Change test status to PENDING if not already PENDING
   */
  private async changeTestStatusToPending(questionGroup: QuestionGroup) {
    // Ensure test relation is loaded
    let test: Test;
    if (questionGroup.test) {
      test = questionGroup.test;
    } else {
      const loaded = await this.questionGroupRepo.findOne({
        where: { id: questionGroup.id },
        relations: ['test'],
      });
      if (!loaded || !loaded.test) {
        return;
      }
      test = loaded.test;
    }

    if (test.status !== ETestStatus.PENDING) {
      test.status = ETestStatus.PENDING;
      await this.testRepo.save(test);
    }
  }

  private isCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com');
  }

  async getMiniTestOverallResponse(
    request: any,
  ): Promise<any> {
    const questionIds: number[] = request.questionGroups
      .flatMap((group: any) => group.userAnswerRequests)
      .map((userAnswer: any) => userAnswer.questionId)
      .filter((id: any) => id != null);

    const questions = await this.questionService.getQuestionsWithGroupsByIds(
      Array.from(new Set(questionIds)),
    );

    await this.questionService.validateQuestion(questionIds, questions);

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    return this.calculatorAnswerMiniTest(request, questionMap, questions);
  }

  private calculatorAnswerMiniTest(
    miniTestRequest: any,
    questionMap: Map<number, any>,
    questions: any[],
  ): any {
    let correctAnswers = 0;
    const miniTestAnswerQuestionResponses = new Map<any, any[]>();
    let groupPosition = 1;
    let globalQuestionPosition = 1;

    for (const questionGroupRequest of miniTestRequest.questionGroups) {
      if (questionGroupRequest.questionGroupId == null) {
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question group');
      }

      for (const userAnswerRequest of questionGroupRequest.userAnswerRequests) {
        if (userAnswerRequest.questionId == null) {
          throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');
        }

        const question = questionMap.get(userAnswerRequest.questionId);
        if (!question) {
          throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');
        }

        if (
          question.questionGroup.id !==
          questionGroupRequest.questionGroupId
        ) {
          throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        const isCorrect =
          userAnswerRequest.answer != null &&
          question.correctOption != null &&
          question.correctOption === userAnswerRequest.answer;

        if (isCorrect) correctAnswers++;

        const miniTestAnswerQuestionResponse = {
          id: question.id,
          position: question.position,
          index: globalQuestionPosition++,
          content: question.content,
          options: question.options,
          correctOption: question.correctOption,
          userAnswer: userAnswerRequest.answer,
          isCorrect,
        };

        if (!miniTestAnswerQuestionResponses.has(question.questionGroup)) {
          miniTestAnswerQuestionResponses.set(question.questionGroup, []);
        }
        const questions = miniTestAnswerQuestionResponses.get(
          question.questionGroup,
        );
        if (questions) {
          questions.push(miniTestAnswerQuestionResponse);
        }
      }
    }

    const groupResponses: any[] = [];
    let groupIndex = 1;
    for (const [
      questionGroup,
      questionResponses,
    ] of miniTestAnswerQuestionResponses.entries()) {
      const miniTestQuestionGroupResponse = {
        id: questionGroup.id,
        index: groupIndex++,
        position: questionGroup.position,
        audioUrl: questionGroup.audioUrl,
        imageUrl: questionGroup.imageUrl,
        passage: questionGroup.passage,
        questions: questionResponses,
      };
      groupResponses.push(miniTestQuestionGroupResponse);
    }

    return {
      correctAnswers,
      totalQuestions: questions.length,
      questionGroups: groupResponses,
    };
  }
}
