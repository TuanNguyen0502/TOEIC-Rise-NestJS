import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
} from '@google/generative-ai';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { ChatMessage } from 'src/entities/chat-message.entity';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { ChatAboutQuestionRequestDto } from './dto/chat-about-question-request.dto';
import { ChatbotResponseDto } from './dto/chatbot-response.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

@Injectable()
export class ChatbotService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly CHAT_MEMORY_RETRIEVE_SIZE = 100; // Config giống Java

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(UserAnswer)
    private readonly userAnswerRepo: Repository<UserAnswer>,
  ) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Main Method: Chat About Question (Stream)
   */
  chatAboutQuestion(
    dto: ChatAboutQuestionRequestDto,
  ): Observable<ChatbotResponseDto> {
    const subject = new Subject<ChatbotResponseDto>();

    // Chạy logic bất đồng bộ để không chặn luồng chính, kết quả sẽ bắn vào subject
    this.processChatFlow(dto, subject);

    return subject.asObservable();
  }

  /**
   * Logic xử lý chính (Mô phỏng Advisor chain: Load History -> Save User Msg -> Call AI -> Save AI Msg)
   */
  private async processChatFlow(
    dto: ChatAboutQuestionRequestDto,
    subject: Subject<ChatbotResponseDto>,
  ) {
    try {
      // 1. Xác định Conversation ID & Message ID
      const conversationId = dto.conversationId || uuidv4();
      const userMessageId = uuidv4();
      const aiMessageId = uuidv4();

      // 2. Xây dựng nội dung tin nhắn (Prompt Context nếu là lần đầu)
      let messageToSend = dto.message;

      // Nếu chưa có conversationId gửi lên, tức là cuộc hội thoại mới -> Kèm Context câu hỏi
      if (!dto.conversationId) {
        const contextPrompt = await this.buildQuestionContext(dto.userAnswerId);
        // Ghép context vào message của user để AI hiểu ngữ cảnh
        messageToSend = `${contextPrompt}\n\nUser Message: ${dto.message}`;
      }

      // 3. [Advisor Logic] Lưu tin nhắn User vào DB
      await this.saveMessageToMemory(
        conversationId,
        userMessageId,
        'USER',
        messageToSend, // Lưu tin nhắn đầy đủ (có context) để lịch sử chính xác
      );

      // 4. [Advisor Logic] Lấy lịch sử chat từ DB
      const history = await this.getChatHistoryForGemini(conversationId);

      // 5. Khởi tạo Chat Session
      const chatSession = this.model.startChat({
        history: history,
      });

      // 6. Gọi Gemini (Streaming)
      // Lưu ý: Vì history đã chứa tin nhắn vừa lưu ở bước 3,
      // nên ta không cần gửi lại text trong sendMessageStream nếu history đã load nó.
      // TUY NHIÊN, Gemini SDK client-side quản lý history hơi khác DB.
      // Cách an toàn nhất: Load history CŨ (trừ tin nhắn hiện tại), sau đó send tin nhắn hiện tại.

      // Fix logic lấy history: Lấy N tin nhắn TRƯỚC tin nhắn hiện tại
      const historyForSession = history.slice(0, -1); // Bỏ tin nhắn vừa save

      const session = this.model.startChat({ history: historyForSession });
      const result = await session.sendMessageStream(messageToSend);

      let fullAiResponse = '';

      // 7. [Stream Processing] Xử lý từng chunk
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullAiResponse += chunkText;

        // Bắn data về client qua SSE
        subject.next({
          response: chunkText,
          conversationId: conversationId,
          messageId: aiMessageId,
        });
      }

      // 8. [Advisor Logic] Lưu câu trả lời của AI vào DB sau khi stream xong
      await this.saveMessageToMemory(
        conversationId,
        aiMessageId,
        'ASSISTANT',
        fullAiResponse,
      );

      subject.complete();
    } catch (error) {
      console.error('Chatbot Process Error:', error);
      subject.error(error);
    }
  }

  // --- Helper Methods (Tương tự logic Java) ---

  private async saveMessageToMemory(
    conversationId: string,
    messageId: string,
    type: 'USER' | 'ASSISTANT' | 'SYSTEM',
    content: string,
  ) {
    const chatMessage = this.chatMessageRepo.create({
      id: messageId,
      conversationId: conversationId,
      messageType: type,
      content: content,
      metadata: {
        // Giả lập metadata giống Java Advisor
        messageId: messageId,
        conversationId: conversationId,
        timestamp: new Date().toISOString(),
      },
    });
    await this.chatMessageRepo.save(chatMessage);
  }

  private async getChatHistoryForGemini(
    conversationId: string,
  ): Promise<Content[]> {
    // Lấy 100 tin nhắn gần nhất
    const messages = await this.chatMessageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: this.CHAT_MEMORY_RETRIEVE_SIZE,
    });

    // Map sang format của Gemini
    return messages.map((msg) => ({
      role: msg.messageType === 'USER' ? 'user' : 'model', // Map 'ASSISTANT' -> 'model'
      parts: [{ text: msg.content }],
    }));
  }

  private async buildQuestionContext(userAnswerId: number): Promise<string> {
    const userAnswer = await this.userAnswerRepo.findOne({
      where: { id: userAnswerId },
      relations: ['question', 'question.questionGroup', 'question.tags'],
    });

    if (!userAnswer) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        'User answer not found',
      );
    }

    const q = userAnswer.question;
    const g = q.questionGroup;
    const tags = q.tags ? q.tags.map((t) => t.name).join(', ') : 'N/A';
    const options = q.options ? q.options.join(', ') : 'N/A';

    // Template giống hệt file Java của bạn
    return `
      Bạn là trợ lý TOEIC Mentor. Nhiệm vụ của bạn là hỗ trợ người dùng giải thích, phân tích và trả lời câu hỏi TOEIC dựa trên dữ liệu cung cấp.
      Hãy đọc kỹ toàn bộ thông tin và phản hồi một cách rõ ràng, chính xác và dễ hiểu.
      Dưới đây là thông tin bạn cần xử lý:
      1. Passage (đoạn văn nếu có): ${g.passage || 'N/A'}
      2. Transcript (nghe hiểu nếu có): ${g.transcript || 'N/A'}
      3. Nội dung câu hỏi: ${q.content}
      4. Các lựa chọn: ${options}
      5. Đáp án đúng: ${q.correctOption}
      6. Giải thích đáp án đúng: ${q.explanation || 'N/A'}
      7. Đáp án người dùng đã chọn: ${userAnswer.answer || 'N/A'}
      8. Tags / Chủ điểm kiến thức: ${tags}
      
      Yêu cầu phản hồi:
      - Trả lời đúng trọng tâm dựa trên tin nhắn người dùng.
      - Giải thích ngắn gọn câu hỏi đang kiểm tra kiến thức gì.
      - Phân tích và chỉ ra cách tìm đáp án đúng.
      - Giải thích vì sao đáp án đúng là phù hợp.
      - Phản hồi theo phong cách thân thiện, rõ ràng.
      
      Lưu ý quan trọng: Chỉ sử dụng thông tin được cung cấp. Không tự tạo thêm dữ liệu.
    `;
  }
}
