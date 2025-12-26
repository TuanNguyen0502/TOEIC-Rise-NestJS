import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from 'src/entities/chat-message.entity';

@Injectable()
export class ChatMemoryService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async getConversationIdByMessageId(messageId: string): Promise<string> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      select: ['conversationId'],
    });

    if (!message) {
      throw new Error(`Message with id ${messageId} not found`);
    }

    return message.conversationId;
  }

  async existsByMessageId(messageId: string): Promise<boolean> {
    const count = await this.chatMessageRepository.count({
      where: { id: messageId },
    });
    return count > 0;
  }

  async existsByConversationId(conversationId: string): Promise<boolean> {
    const count = await this.chatMessageRepository.count({
      where: { conversationId },
    });
    return count > 0;
  }

  async getChatHistory(conversationId: string): Promise<
    Array<{
      messageId: string;
      content: string;
      conversationId: string;
      messageType: string;
    }>
  > {
    const messages = await this.chatMessageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      select: ['id', 'content', 'conversationId', 'messageType'],
    });

    return messages.map((msg) => ({
      messageId: msg.id,
      content: msg.content,
      conversationId: msg.conversationId,
      messageType: msg.messageType,
    }));
  }

  async getMessageById(messageId: string): Promise<ChatMessage | null> {
    return this.chatMessageRepository.findOne({
      where: { id: messageId },
    });
  }

  async countAllConversation(): Promise<number> {
    const result = await this.chatMessageRepository
      .createQueryBuilder('cm')
      .select('COUNT(DISTINCT cm.conversationId)', 'count')
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  async countTotalAiConversation(
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await this.chatMessageRepository
      .createQueryBuilder('cm')
      .select('COUNT(DISTINCT cm.conversationId)', 'count')
      .where('cm.createdAt >= :start', { start })
      .andWhere('cm.createdAt < :end', { end })
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }
}

