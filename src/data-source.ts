import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Import all your entities
import { Account } from './entities/account.entity';
import { ChatbotRating } from './entities/chatbot-rating.entity';
import { ChatTitle } from './entities/chat-title.entity';
import { Part } from './entities/part.entity';
import { Question } from './entities/question.entity';
import { QuestionGroup } from './entities/question-group.entity';
import { Role } from './entities/role.entity';
import { SystemPrompt } from './entities/system-prompt.entity';
import { Tag } from './entities/tag.entity';
import { Test } from './entities/test.entity';
import { TestSet } from './entities/test-set.entity';
import { User } from './entities/user.entity';
import { UserAnswer } from './entities/user-answer.entity';
import { UserTest } from './entities/user-test.entity';
import { Flashcard } from './entities/flashcard.entity';
import { FlashcardItem } from './entities/flashcard-item.entity';
import { FlashcardFavourite } from './entities/flashcard-favourite.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql', // From your pom.xml and SQL files
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false, // Never use 'true' in production
  logging: true,
  entities: [
    Account,
    ChatbotRating,
    ChatTitle,
    Part,
    Question,
    QuestionGroup,
    Role,
    SystemPrompt,
    Tag,
    Test,
    TestSet,
    User,
    UserAnswer,
    UserTest,
    Flashcard,
    FlashcardItem,
    FlashcardFavourite,
  ],
  migrations: ['src/migrations/*.ts'], // Path to your new migration files
  subscribers: [],
});
