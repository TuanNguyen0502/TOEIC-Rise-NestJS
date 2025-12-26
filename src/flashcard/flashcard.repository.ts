import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flashcard } from 'src/entities/flashcard.entity';
import { EAccessType } from 'src/enums/EAccessType.enum';

@Injectable()
export class FlashcardRepository {
  constructor(
    @InjectRepository(Flashcard)
    private readonly repository: Repository<Flashcard>,
  ) {}

  async findPublicFlashcardsWithFavouriteStatus(
    userId: number,
    accessType: EAccessType,
    name: string | null,
    page: number,
    size: number,
    sortBy: string,
    direction: 'ASC' | 'DESC',
  ): Promise<[Flashcard[], number]> {
    const query = this.repository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.user', 'user')
      .leftJoinAndSelect('f.items', 'items')
      .leftJoinAndSelect(
        'flashcard_favourites',
        'fav',
        'f.id = fav.flashcard_id AND fav.user_id = :userId',
        { userId },
      )
      .where('f.access_type = :accessType', { accessType })
      .select([
        'f',
        'user',
        'items',
        'CASE WHEN fav.id IS NOT NULL THEN true ELSE false END as isFavourite',
      ]);

    if (name) {
      query.andWhere('LOWER(f.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    query
      .orderBy(`f.${sortBy}`, direction)
      .skip(page * size)
      .take(size);

    const [results, total] = await query.getManyAndCount();
    return [results, total];
  }

  async findMyFlashcardsWithFavouriteStatus(
    userId: number,
    name: string | null,
    page: number,
    size: number,
    sortBy: string,
    direction: 'ASC' | 'DESC',
  ): Promise<[Flashcard[], number]> {
    const query = this.repository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.user', 'user')
      .leftJoinAndSelect('f.items', 'items')
      .leftJoinAndSelect(
        'flashcard_favourites',
        'fav',
        'f.id = fav.flashcard_id AND fav.user_id = :userId',
        { userId },
      )
      .where('f.user_id = :userId', { userId });

    if (name) {
      query.andWhere('LOWER(f.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    query
      .orderBy(`f.${sortBy}`, direction)
      .skip(page * size)
      .take(size);

    const [results, total] = await query.getManyAndCount();
    return [results, total];
  }
}
