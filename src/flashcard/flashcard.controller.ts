import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FlashcardService } from './flashcard.service';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('learner/flashcards')
@ApiBearerAuth('JWT')
@Controller('learner/flashcards')
@UseGuards(JwtAuthGuard)
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  @Get('public')
  async getPublicFlashcards(
    @GetCurrentUserEmail() email: string,
    @Query('name') name?: string,
    @Query('page') page: number = 0,
    @Query('size') size: number = 10,
    @Query('sortBy') sortBy: string = 'favouriteCount',
    @Query('direction') direction: string = 'DESC',
  ) {
    return this.flashcardService.getAllPublicFlashcards(
      email,
      name || null,
      page,
      size,
      sortBy,
      direction,
    );
  }

  @Get('my')
  async getMyFlashcards(
    @GetCurrentUserEmail() email: string,
    @Query('name') name?: string,
    @Query('page') page: number = 0,
    @Query('size') size: number = 10,
    @Query('sortBy') sortBy: string = 'favouriteCount',
    @Query('direction') direction: string = 'DESC',
  ) {
    return this.flashcardService.getAllMyFlashcards(
      email,
      name || null,
      page,
      size,
      sortBy,
      direction,
    );
  }

  @Get('favourite')
  async getMyFavouriteFlashcards(
    @GetCurrentUserEmail() email: string,
    @Query('name') name?: string,
    @Query('page') page: number = 0,
    @Query('size') size: number = 10,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('direction') direction: string = 'DESC',
  ) {
    return this.flashcardService.getAllMyFavouriteFlashcards(
      email,
      name || null,
      page,
      size,
      sortBy,
      direction,
    );
  }
}
