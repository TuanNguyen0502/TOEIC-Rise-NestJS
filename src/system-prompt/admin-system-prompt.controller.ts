import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SystemPromptService } from './system-prompt.service';
import { GetSystemPromptsQueryDto } from './dto/get-system-prompts-query.dto';
import { SystemPromptCreateRequestDto } from './dto/system-prompt-create-request.dto';
import { SystemPromptUpdateRequestDto } from './dto/system-prompt-update-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';

@ApiTags('admin/system-prompts')
@ApiBearerAuth('JWT')
@Controller('admin/system-prompts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN)
export class AdminSystemPromptController {
  constructor(
    private readonly systemPromptService: SystemPromptService,
  ) {}

  @Get()
  async getAllSystemPrompts(@Query() query: GetSystemPromptsQueryDto) {
    return this.systemPromptService.getAllSystemPrompts(
      query.isActive,
      query.version,
      query.page,
      query.size,
      query.sortBy,
      query.direction,
    );
  }

  @Get(':id')
  async getSystemPromptById(@Param('id', ParseIntPipe) id: number) {
    return this.systemPromptService.getSystemPromptById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateSystemPrompt(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: SystemPromptUpdateRequestDto,
  ) {
    await this.systemPromptService.updateSystemPrompt(id, request);
    return { message: 'Update successful' };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async changeActive(@Param('id', ParseIntPipe) id: number) {
    await this.systemPromptService.changeActive(id);
    return { message: 'Change active successful' };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async createSystemPrompt(@Body() request: SystemPromptCreateRequestDto) {
    await this.systemPromptService.createSystemPrompt(request);
    return { message: 'Create successful' };
  }
}

