import {
  Controller,
  Get,
  Query,
  UseGuards,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FlashcardService } from './flashcard.service';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FlashcardCreateRequest } from './dto/flashcard-create-request.dto';

@ApiTags('learner/flashcards')
@ApiBearerAuth('JWT')
@Controller('learner/flashcards')
@UseGuards(JwtAuthGuard)
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFlashcard(
    @Body() flashcardCreateRequest: FlashcardCreateRequest,
    @GetCurrentUserEmail() email: string,
  ) {
    await this.flashcardService.createFlashcard(email, flashcardCreateRequest);
    return { message: 'Flashcard created successfully' };
  }

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

  @Post('favourite/:flashcardId')
  @HttpCode(HttpStatus.OK)
  async addFlashcardToFavourite(
    @Param('flashcardId', ParseIntPipe) flashcardId: number,
    @GetCurrentUserEmail() email: string,
  ) {
    await this.flashcardService.addFavourite(email, flashcardId);
    return { message: 'Added to favourites' };
  }

  @Delete('favourite/:flashcardId')
  @HttpCode(HttpStatus.OK)
  async deleteFlashcardFromFavourite(
    @Param('flashcardId', ParseIntPipe) flashcardId: number,
    @GetCurrentUserEmail() email: string,
  ) {
    await this.flashcardService.deleteFavourite(email, flashcardId);
    return { message: 'Removed from favourites' };
  }

  @Get(':flashcardId')
  async getFlashcardDetail(
    @Param('flashcardId', ParseIntPipe) flashcardId: number,
    @GetCurrentUserEmail() email: string,
  ) {
    return this.flashcardService.getFlashcardDetailById(email, flashcardId);
  }

  @Delete(':flashcardId')
  @HttpCode(HttpStatus.OK)
  async deleteFlashcard(
    @Param('flashcardId', ParseIntPipe) flashcardId: number,
    @GetCurrentUserEmail() email: string,
  ) {
    await this.flashcardService.deleteFlashcard(email, flashcardId);
    return { message: 'Flashcard deleted' };
  }
}
