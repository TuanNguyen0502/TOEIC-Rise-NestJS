import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Sse, 
  UseInterceptors 
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(AnyFilesInterceptor())
  chatAboutQuestion(
    @Body() request: ChatAboutQuestionRequestDto,
  ): Observable<any> {
    console.log('✅ Controller đã nhận request:', request);

    return this.chatbotService.chatAboutQuestion(request).pipe(
      map((data) => ({ data }))
    );
  }
}