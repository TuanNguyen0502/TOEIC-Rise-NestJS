import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemPrompt } from 'src/entities/system-prompt.entity';
import { SystemPromptService } from './system-prompt.service';
import { AdminSystemPromptController } from './admin-system-prompt.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SystemPrompt]), AuthModule],
  controllers: [AdminSystemPromptController],
  providers: [SystemPromptService],
  exports: [SystemPromptService],
})
export class SystemPromptModule {}

