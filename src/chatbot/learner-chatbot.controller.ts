import { Controller, Post, Body, UseGuards, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatbotService } from './chatbot.service';
import { ChatAboutQuestionRequestDto } from './dto/chat-about-question-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('learner/chatbot')
@UseGuards(JwtAuthGuard)
export class LearnerChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat-about-question')
  @Sse()
  chatAboutQuestion(
    @Body() request: ChatAboutQuestionRequestDto,
  ): Observable<any> {

    return this.chatbotService
      .chatAboutQuestion(request)
      .pipe(map((data) => ({ data })));
  }
}
