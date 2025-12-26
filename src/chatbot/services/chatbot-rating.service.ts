import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, In } from 'typeorm';
import { ChatbotRating } from 'src/entities/chatbot-rating.entity';
import { ChatMessage } from 'src/entities/chat-message.entity';
import { ChatTitle } from 'src/entities/chat-title.entity';
import { User } from 'src/entities/user.entity';
import { EChatbotRating } from 'src/enums/EChatbotRating.enum';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { ChatbotRatingRequestDto } from '../dto/chatbot-rating-request.dto';
import { ChatbotRatingResponseDto } from '../dto/chatbot-rating-response.dto';
import { ChatbotRatingDetailResponseDto } from '../dto/chatbot-rating-detail-response.dto';
import { ChatMemoryService } from './chat-memory.service';
import { formatInTimeZone } from 'date-fns-tz';
import { DATE_TIME_PATTERN } from 'src/common/constants/constants';
import { PageResponse } from 'src/test-set/dto/page-response.dto';

@Injectable()
export class ChatbotRatingService {
  constructor(
    @InjectRepository(ChatbotRating)
    private readonly chatbotRatingRepository: Repository<ChatbotRating>,
    @InjectRepository(ChatTitle)
    private readonly chatTitleRepository: Repository<ChatTitle>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly chatMemoryService: ChatMemoryService,
  ) {}

  async getChatbotRatings(
    rating: EChatbotRating | undefined,
    conversationTitle: string | undefined,
    page: number,
    size: number,
    sortBy: string,
    direction: 'ASC' | 'DESC',
  ): Promise<PageResponse<ChatbotRatingResponseDto[]>> {
    const where: FindManyOptions<ChatbotRating>['where'] = {};

    if (rating) {
      where.rating = rating;
    }

    if (conversationTitle) {
      where.conversationTitle = Like(`%${conversationTitle}%`);
    }

    const [result, total] = await this.chatbotRatingRepository.findAndCount({
      where,
      relations: ['user', 'user.account'],
      order: { [sortBy]: direction },
      take: size,
      skip: page * size,
    });

    const chatbotRatingResponses: ChatbotRatingResponseDto[] = result.map(
      (rating) => ({
        id: rating.id,
        conversationTitle: rating.conversationTitle,
        message: rating.message,
        rating: rating.rating,
        createdAt: formatInTimeZone(
          rating.createdAt,
          'Asia/Ho_Chi_Minh',
          DATE_TIME_PATTERN,
        ),
      }),
    );

    return {
      meta: {
        page,
        pageSize: size,
        pages: Math.ceil(total / size),
        total,
      },
      result: chatbotRatingResponses,
    };
  }

  async countLikeRating(): Promise<number> {
    return this.chatbotRatingRepository.count({
      where: { rating: EChatbotRating.LIKE },
    });
  }

  async countDislikeRating(): Promise<number> {
    return this.chatbotRatingRepository.count({
      where: { rating: EChatbotRating.DISLIKE },
    });
  }

  async getChatbotRatingDetail(
    id: number,
  ): Promise<ChatbotRatingDetailResponseDto> {
    const chatbotRating = await this.chatbotRatingRepository.findOne({
      where: { id },
      relations: ['user', 'user.account'],
    });

    if (!chatbotRating) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Chatbot rating');
    }

    // If messageId is null, return empty chat history
    if (!chatbotRating.messageId) {
      return {
        id: chatbotRating.id,
        userEmail: chatbotRating.user.account.email,
        conversationTitle: chatbotRating.conversationTitle,
        messageId: chatbotRating.messageId || '',
        message: chatbotRating.message,
        rating: chatbotRating.rating,
        createdAt: formatInTimeZone(
          chatbotRating.createdAt,
          'Asia/Ho_Chi_Minh',
          DATE_TIME_PATTERN,
        ),
        chatbotResponses: [],
      };
    }

    // Get chat history
    const conversationId =
      await this.chatMemoryService.getConversationIdByMessageId(
        chatbotRating.messageId,
      );
    const chatHistory = await this.chatMemoryService.getChatHistory(
      conversationId,
    );

    // Map chat history with ratings
    // Get all ratings for messages in this conversation
    const messageIds = chatHistory.map((cm) => cm.messageId);
    const ratings =
      messageIds.length > 0
        ? await this.chatbotRatingRepository.find({
            where: { messageId: In(messageIds) },
          })
        : [];

    // Create a map of messageId -> rating for quick lookup
    const ratingMap = new Map<string, EChatbotRating>();
    ratings.forEach((r) => {
      if (r.messageId) {
        ratingMap.set(r.messageId, r.rating);
      }
    });

    const chatbotResponses = chatHistory.map((chatMemory) => {
      const rating = ratingMap.get(chatMemory.messageId);

      return {
        content: chatMemory.content,
        messageType: chatMemory.messageType,
        rating: rating || null,
      };
    });

    return {
      id: chatbotRating.id,
      userEmail: chatbotRating.user.account.email,
      conversationTitle: chatbotRating.conversationTitle,
      messageId: chatbotRating.messageId,
      message: chatbotRating.message,
      rating: chatbotRating.rating,
      createdAt: formatInTimeZone(
        chatbotRating.createdAt,
        'Asia/Ho_Chi_Minh',
        DATE_TIME_PATTERN,
      ),
      chatbotResponses,
    };
  }

  async createChatbotRating(
    chatbotRatingRequest: ChatbotRatingRequestDto,
    email: string,
  ): Promise<void> {
    // Check if the messageId already has a rating
    const existingRating = await this.chatbotRatingRepository.findOne({
      where: { messageId: chatbotRatingRequest.messageId },
    });

    if (existingRating) {
      return; // Already rated, skip
    }

    // Check if message exists in chat memory
    const messageExists =
      await this.chatMemoryService.existsByMessageId(
        chatbotRatingRequest.messageId,
      );

    if (!messageExists) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Chat message');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { account: { email } },
      relations: ['account'],
    });

    if (!user) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    // Get conversation title
    const conversationId =
      await this.chatMemoryService.getConversationIdByMessageId(
        chatbotRatingRequest.messageId,
      );
    const chatTitle = await this.chatTitleRepository.findOne({
      where: { conversationId, user: { id: user.id } },
    });

    const conversationTitle = chatTitle?.title || 'No title';

    // Get message
    const chatMessage = await this.chatMemoryService.getMessageById(
      chatbotRatingRequest.messageId,
    );

    if (!chatMessage) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Chat message');
    }

    // Create new chatbot rating
    const chatbotRating = this.chatbotRatingRepository.create({
      user,
      conversationTitle,
      messageId: chatbotRatingRequest.messageId,
      message: chatMessage.content,
      rating: chatbotRatingRequest.rating,
    });

    await this.chatbotRatingRepository.save(chatbotRating);
  }
}

