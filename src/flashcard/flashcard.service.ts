import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flashcard } from 'src/entities/flashcard.entity';
import { User } from 'src/entities/user.entity';
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
    // Get user from email
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });

    if (!user) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    // Build query
    const query = this.flashcardRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.user', 'user')
      .leftJoinAndSelect('f.items', 'items')
      .leftJoin(
        'flashcard_favourites',
        'fav',
        'f.id = fav.flashcard_id AND fav.user_id = :userId',
        { userId: user.id },
      )
      .addSelect(
        'CASE WHEN fav.id IS NOT NULL THEN true ELSE false END',
        'isFavourite',
      )
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

    // Map results
    const flashcards = results.map((flashcard) => {
      const isFavourite = (flashcard as any).isFavourite === 'true' || false;
      return this.flashcardMapper.toFlashcardPublicResponse(
        flashcard,
        isFavourite,
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
}
