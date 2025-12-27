import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Flashcard } from 'src/entities/flashcard.entity';
import { FlashcardItem } from 'src/entities/flashcard-item.entity';
import { User } from 'src/entities/user.entity';
import { FlashcardFavourite } from 'src/entities/flashcard-favourite.entity';
import { EAccessType } from 'src/enums/EAccessType.enum';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { FlashcardMapper } from './mapper/flashcard.mapper';
import { FlashcardCreateRequest } from './dto/flashcard-create-request.dto';
import { FlashcardUpdateRequest } from './dto/flashcard-update-request.dto';

@Injectable()
export class FlashcardService {
  constructor(
    @InjectRepository(Flashcard)
    private readonly flashcardRepository: Repository<Flashcard>,
    @InjectRepository(FlashcardItem)
    private readonly flashcardItemRepository: Repository<FlashcardItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FlashcardFavourite)
    private readonly flashcardFavouriteRepository: Repository<FlashcardFavourite>,
    private readonly flashcardMapper: FlashcardMapper,
  ) {}

  async totalFlashcards(): Promise<number> {
    return this.flashcardRepository.count();
  }

  async createFlashcard(
    email: string,
    flashcardCreateRequest: FlashcardCreateRequest,
  ): Promise<void> {
    // Get user by email
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });
    if (!user) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    // Create flashcard entity
    const flashcard = this.flashcardRepository.create({
      user,
      name: flashcardCreateRequest.name,
      description: flashcardCreateRequest.description,
      accessType: flashcardCreateRequest.accessType,
      favouriteCount: 0,
    });

    // Save flashcard first to get the ID
    const savedFlashcard = await this.flashcardRepository.save(flashcard);

    // Create and save flashcard items if provided
    if (
      flashcardCreateRequest.items &&
      flashcardCreateRequest.items.length > 0
    ) {
      const flashcardItems = flashcardCreateRequest.items.map((itemRequest) =>
        this.flashcardItemRepository.create({
          flashcard: savedFlashcard,
          vocabulary: itemRequest.vocabulary,
          definition: itemRequest.definition,
          audioUrl: itemRequest.audioUrl,
          pronunciation: itemRequest.pronunciation,
        }),
      );

      await this.flashcardItemRepository.save(flashcardItems);
    }
  }

  async getAllPublicFlashcards(
    email: string,
    name: string | null,
    page: number,
    size: number,
    sortBy: string,
    direction: string,
  ) {

    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });

    if (!user) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    const query = this.flashcardRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.user', 'user')
      .leftJoinAndSelect('f.items', 'items')
      .where('f.access_type = :accessType', { accessType: EAccessType.PUBLIC });

    if (name) {
      query.andWhere('LOWER(f.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    query
      .orderBy(`f.${sortBy}`, direction as 'ASC' | 'DESC')
      .skip(page * size)
      .take(size);

    const [results, total] = await query.getManyAndCount();

    const flashcardIds = results.map((f) => f.id);

    const userFavourites = await this.flashcardFavouriteRepository.find({
      where: {
        user: { id: user.id },
        flashcard: { id: flashcardIds.length > 0 ? In(flashcardIds) : In([]) },
      },
      relations: ['flashcard'],
    });

    const favouriteIds = new Set(userFavourites.map((f) => f.flashcard.id));

    const flashcards = results.map((flashcard) => {
      const favourite = favouriteIds.has(flashcard.id);
      return this.flashcardMapper.toFlashcardPublicResponse(
        flashcard,
        favourite,
      );
    });

    return {
      meta: {
        page,
        pageSize: size,
        pages: Math.ceil(total / size),
        total,
      },
      result: flashcards,
    };
  }

  async getAllMyFlashcards(
    email: string,
    name: string | null,
    page: number,
    size: number,
    sortBy: string,
    direction: string,
  ) {
    // Get user from email
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });

    if (!user) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    const query = this.flashcardRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.user', 'user')
      .leftJoinAndSelect('f.items', 'items')
      .where('f.user_id = :userId', { userId: user.id });

    if (name) {
      query.andWhere('LOWER(f.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    query
      .orderBy(`f.${sortBy}`, direction as 'ASC' | 'DESC')
      .skip(page * size)
      .take(size);

    const [results, total] = await query.getManyAndCount();

    const flashcardIds = results.map((f) => f.id);

    const userFavourites = await this.flashcardFavouriteRepository.find({
      where: {
        user: { id: user.id },
        flashcard: { id: flashcardIds.length > 0 ? In(flashcardIds) : In([]) },
      },
      relations: ['flashcard'],
    });

    const favouriteIds = new Set(userFavourites.map((f) => f.flashcard.id));

    const flashcards = results.map((flashcard) => {
      const favourite = favouriteIds.has(flashcard.id);
      return this.flashcardMapper.toFlashcardPublicResponse(
        flashcard,
        favourite,
      );
    });

    return {
      meta: {
        page,
        pageSize: size,
        pages: Math.ceil(total / size),
        total,
      },
      result: flashcards,
    };
  }

  async getAllMyFavouriteFlashcards(
    email: string,
    name: string | null,
    page: number,
    size: number,
    sortBy: string,
    direction: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });

    if (!user) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    const query = this.flashcardRepository
      .createQueryBuilder('f')
      .innerJoin(
        'flashcard_favourites',
        'fav',
        'f.id = fav.flashcard_id AND fav.user_id = :userId',
        { userId: user.id },
      )
      .leftJoinAndSelect('f.user', 'user')
      .leftJoinAndSelect('f.items', 'items')
      .addSelect('true', 'isFavourite')
      .where('f.access_type = :accessType', {
        accessType: EAccessType.PUBLIC,
      });

    if (name) {
      query.andWhere('LOWER(f.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    query
      .orderBy(`f.${sortBy}`, direction as 'ASC' | 'DESC')
      .skip(page * size)
      .take(size);

    const [results, total] = await query.getManyAndCount();

    const flashcards = results.map((flashcard) => {
      return this.flashcardMapper.toFlashcardPublicResponse(flashcard, true);
    });

    return {
      meta: {
        page,
        pageSize: size,
        pages: Math.ceil(total / size),
        total,
      },
      result: flashcards,
    };
  }

  async addFavourite(email: string, flashcardId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });
    if (!user) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User');
    }

    const flashcard = await this.flashcardRepository.findOne({
      where: { id: flashcardId },
      relations: ['user'],
    });
    if (!flashcard) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Flashcard');
    }

    if (
      flashcard.accessType !== EAccessType.PUBLIC &&
      flashcard.user.id !== user.id
    ) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Flashcard');
    }

    // Check if already favourite
    const exists = await this.flashcardFavouriteRepository.findOne({
      where: { user: { id: user.id }, flashcard: { id: flashcardId } },
    });
    if (exists) {
      throw new AppException(
        ErrorCode.RESOURCE_ALREADY_EXISTS,
        'Flashcard favourite',
      );
    }

    flashcard.favouriteCount += 1;
    await this.flashcardRepository.save(flashcard);

    const favourite = this.flashcardFavouriteRepository.create({
      user,
      flashcard,
    });
    await this.flashcardFavouriteRepository.save(favourite);
  }

  async deleteFavourite(email: string, flashcardId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });
    if (!user) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User');
    }

    const favourite = await this.flashcardFavouriteRepository.findOne({
      where: {
        user: { id: user.id },
        flashcard: { id: flashcardId },
      },
      relations: ['flashcard'],
    });
    if (!favourite) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Favourite flashcard');
    }

    // Decrement favourite count
    const flashcard = favourite.flashcard;
    flashcard.favouriteCount = Math.max(0, flashcard.favouriteCount - 1);
    await this.flashcardRepository.save(flashcard);

    // Delete the favourite record
    await this.flashcardFavouriteRepository.delete(favourite.id);
  }

  async getFlashcardDetailById(email: string, flashcardId: number) {
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });
    if (!user) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    const flashcard = await this.flashcardRepository.findOne({
      where: { id: flashcardId },
      relations: ['user', 'items'],
    });
    if (!flashcard) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Flashcard');
    }

    // Check access for PRIVATE flashcards
    if (
      flashcard.accessType === EAccessType.PRIVATE &&
      flashcard.user.id !== user.id
    ) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Flashcard');
    }

    // Check if owner
    const isOwner = flashcard.user.id === user.id;

    // Check if favourite
    const favourite = await this.flashcardFavouriteRepository.findOne({
      where: {
        user: { id: user.id },
        flashcard: { id: flashcardId },
      },
    });
    const isFavourite = favourite != null;

    // Map items
    const items = flashcard.items.map((item) =>
      this.flashcardMapper.toFlashcardItemDetailResponse(item),
    );

    return this.flashcardMapper.toFlashcardDetailResponse(
      flashcard,
      isOwner,
      isFavourite,
      items,
    );
  }

  async deleteFlashcard(email: string, flashcardId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });
    if (!user) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    const flashcard = await this.flashcardRepository.findOne({
      where: { id: flashcardId },
      relations: ['user'],
    });
    if (!flashcard) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Flashcard');
    }

    // Check ownership
    if (flashcard.user.id !== user.id) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Flashcard');
    }

    // Delete associated favourites
    await this.flashcardFavouriteRepository.delete({ flashcard: { id: flashcardId } });

    // Delete flashcard
    await this.flashcardRepository.delete(flashcardId);
  }

  async updateFlashcard(
    email: string,
    flashcardId: number,
    flashcardUpdateRequest: FlashcardUpdateRequest,
  ) {
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });
    if (!user) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    const flashcard = await this.flashcardRepository.findOne({
      where: { id: flashcardId },
      relations: ['user', 'items'],
    });
    if (!flashcard) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Flashcard');
    }

    // Check ownership
    if (flashcard.user.id !== user.id) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Flashcard');
    }

    // Update flashcard details
    this.flashcardMapper.updateFlashcard(flashcardUpdateRequest, flashcard);
    await this.flashcardRepository.save(flashcard);

    // Delete all old items
    await this.flashcardItemRepository.delete({ flashcard: { id: flashcardId } });

    // Create all new items from request
    if (
      flashcardUpdateRequest.items &&
      flashcardUpdateRequest.items.length > 0
    ) {
      const newItems = flashcardUpdateRequest.items.map((itemRequest) =>
        this.flashcardItemRepository.create({
          flashcard,
          vocabulary: itemRequest.vocabulary,
          definition: itemRequest.definition,
          audioUrl: itemRequest.audioUrl,
          pronunciation: itemRequest.pronunciation,
        }),
      );
      await this.flashcardItemRepository.save(newItems);
    }
  }
}
