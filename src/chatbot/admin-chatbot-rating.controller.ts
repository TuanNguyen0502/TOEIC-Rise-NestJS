import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotRatingService } from './services/chatbot-rating.service';
import { GetChatbotRatingsQueryDto } from './dto/get-chatbot-ratings-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';

@ApiTags('admin/chatbot-ratings')
@ApiBearerAuth('JWT')
@Controller('admin/chatbot-ratings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN)
export class AdminChatbotRatingController {
  constructor(
    private readonly chatbotRatingService: ChatbotRatingService,
  ) {}

  @Get()
  async getChatbotRatings(@Query() query: GetChatbotRatingsQueryDto) {
    return this.chatbotRatingService.getChatbotRatings(
      query.rating,
      query.conversationTitle,
      query.page,
      query.size,
      query.sortBy,
      query.direction,
    );
  }

  @Get('count-like')
  async countLikeRating() {
    const count = await this.chatbotRatingService.countLikeRating();
    return { count };
  }

  @Get('count-dislike')
  async countDislikeRating() {
    const count = await this.chatbotRatingService.countDislikeRating();
    return { count };
  }

  @Get(':id')
  async getChatbotRatingById(@Param('id', ParseIntPipe) id: number) {
    return this.chatbotRatingService.getChatbotRatingDetail(id);
  }
}

