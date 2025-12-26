export class ChatbotRatingDetailResponseDto {
  id: number;
  userEmail: string;
  conversationTitle: string;
  messageId: string;
  message: string;
  rating: string;
  createdAt: string;
  chatbotResponses: ChatbotResponseDto[];
}

export class ChatbotResponseDto {
  content: string;
  messageType: string;
  rating: string | null;
}

