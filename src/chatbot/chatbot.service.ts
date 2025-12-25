import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
  ChatSession,
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
  private ChatSessions: { [conversationId: string]: ChatSession } = {};

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

  chatAboutQuestion(
    dto: ChatAboutQuestionRequestDto,
  ): Observable<ChatbotResponseDto> {
    const subject = new Subject<ChatbotResponseDto>();

    // Chạy logic bất đồng bộ để không chặn luồng chính, kết quả sẽ bắn vào subject
    this.processChatFlow(dto, subject);

    return subject.asObservable();
  }

  private async processChatFlow(
    dto: ChatAboutQuestionRequestDto,
    subject: Subject<ChatbotResponseDto>,
  ) {
    try {
      // 1. Xác định Conversation ID & Message ID
      const conversationId = dto.conversationId || uuidv4();
      const aiMessageId = uuidv4();

      // 2. Xây dựng nội dung tin nhắn (Prompt Context nếu là lần đầu)
      let messageToSend = dto.message;

      // Nếu chưa có conversationId gửi lên, tức là cuộc hội thoại mới -> Kèm Context câu hỏi
      if (!dto.conversationId) {
        const contextPrompt = await this.buildQuestionContext(dto.userAnswerId);
        // Ghép context vào message của user để AI hiểu ngữ cảnh
        messageToSend = `${contextPrompt}\n\nUser Message: ${dto.message}`;
      }

      // 4. [Advisor Logic] Lấy lịch sử chat từ DB
      const history = await this.getChatHistoryForGemini(conversationId);

      // 6. Gọi Gemini (Streaming)
      const result = await history.sendMessageStream(messageToSend);

      let fullAiResponse = '';

      // 7. [Stream Processing] Xử lý từng chunk
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullAiResponse += chunkText;

        // Bắn data về client qua SSE
        subject.next({
          content: chunkText,
          conversationId: conversationId,
          messageId: aiMessageId,
        });
      }

      subject.complete();
    } catch (error) {
      console.error('Chatbot Process Error:', error);
      subject.error(error);
    }
  }

  private async getChatHistoryForGemini(conversationId: string) {
    let result = await this.ChatSessions[conversationId];

    if (!result) {
      result = this.model.startChat();
      this.ChatSessions[conversationId] = result;
    }

    return result;
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
