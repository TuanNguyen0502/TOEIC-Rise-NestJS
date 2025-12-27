import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Flashcard } from 'src/entities/flashcard.entity';
import { User } from 'src/entities/user.entity';
import { FlashcardFavourite } from 'src/entities/flashcard-favourite.entity';
import { EAccessType } from 'src/enums/EAccessType.enum';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { FlashcardMapper } from './mapper/flashcard.mapper';

@Injectable()
export class FlashcardService {
  constructor(
    @InjectRepository(Flashcard)
    private readonly flashcardRepository: Repository<Flashcard>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FlashcardFavourite)
    private readonly flashcardFavouriteRepository: Repository<FlashcardFavourite>,
    private readonly flashcardMapper: FlashcardMapper,
  ) {}

  async totalFlashcards(): Promise<number> {
    return this.flashcardRepository.count();
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
      .addSelect('true', 'isFavourite');

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
}
