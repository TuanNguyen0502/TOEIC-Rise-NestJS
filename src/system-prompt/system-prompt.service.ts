import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, MoreThan } from 'typeorm';
import type { Cache } from 'cache-manager';
import { SystemPrompt } from 'src/entities/system-prompt.entity';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { SystemPromptCreateRequestDto } from './dto/system-prompt-create-request.dto';
import { SystemPromptUpdateRequestDto } from './dto/system-prompt-update-request.dto';
import { SystemPromptResponseDto } from './dto/system-prompt-response.dto';
import { SystemPromptDetailResponseDto } from './dto/system-prompt-detail-response.dto';
import { PageResponse } from 'src/test-set/dto/page-response.dto';
import {
  SYSTEM_PROMPT_CACHE,
  ACTIVE_PROMPT_KEY,
  CACHE_DURATION,
} from 'src/common/constants/constants';
import { formatInTimeZone } from 'date-fns-tz';
import { DATE_TIME_PATTERN, TIMEZONE_VIETNAM } from 'src/common/constants/constants';

@Injectable()
export class SystemPromptService {
  constructor(
    @InjectRepository(SystemPrompt)
    private readonly systemPromptRepository: Repository<SystemPrompt>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAllSystemPrompts(
    isActive: boolean | undefined,
    version: number | undefined,
    page: number,
    size: number,
    sortBy: string,
    direction: 'ASC' | 'DESC',
  ): Promise<PageResponse<SystemPromptResponseDto[]>> {
    const where: FindManyOptions<SystemPrompt>['where'] = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (version !== undefined) {
      where.version = MoreThan(version);
    }

    const [result, total] = await this.systemPromptRepository.findAndCount({
      where,
      order: { [sortBy]: direction },
      take: size,
      skip: page * size,
    });

    // Map entities to responses and truncate content
    const systemPrompts: SystemPromptResponseDto[] = result.map((prompt) => {
      let content = prompt.content;
      // Truncate content to a shorter version (e.g., first 100 characters + "...")
      if (content && content.length > 100) {
        content = content.substring(0, 100) + '...';
      }

      return {
        id: prompt.id,
        content,
        version: prompt.version,
        isActive: prompt.isActive,
        updatedAt: formatInTimeZone(
          prompt.updatedAt,
          TIMEZONE_VIETNAM,
          DATE_TIME_PATTERN,
        ),
      };
    });

    return {
      meta: {
        page,
        pageSize: size,
        pages: Math.ceil(total / size),
        total,
      },
      result: systemPrompts,
    };
  }

  async getSystemPromptById(
    id: number,
  ): Promise<SystemPromptDetailResponseDto> {
    const systemPrompt = await this.systemPromptRepository.findOne({
      where: { id },
    });

    if (!systemPrompt) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'System Prompt');
    }

    return {
      id: systemPrompt.id,
      content: systemPrompt.content,
      version: systemPrompt.version,
      isActive: systemPrompt.isActive,
      createdAt: formatInTimeZone(
        systemPrompt.createdAt,
        TIMEZONE_VIETNAM,
        DATE_TIME_PATTERN,
      ),
      updatedAt: formatInTimeZone(
        systemPrompt.updatedAt,
        TIMEZONE_VIETNAM,
        DATE_TIME_PATTERN,
      ),
    };
  }

  async getActiveSystemPrompt(): Promise<SystemPromptDetailResponseDto> {
    // Try to get from cache first
    const cacheKey = `${SYSTEM_PROMPT_CACHE}:${ACTIVE_PROMPT_KEY}`;
    const cachedPrompt = await this.cacheManager.get<SystemPromptDetailResponseDto>(
      cacheKey,
    );

    if (cachedPrompt) {
      return cachedPrompt;
    }

    // If not in cache, get from database and cache it
    const activePrompt = await this.systemPromptRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    if (!activePrompt) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Active System Prompt',
      );
    }

    const response: SystemPromptDetailResponseDto = {
      id: activePrompt.id,
      content: activePrompt.content,
      version: activePrompt.version,
      isActive: activePrompt.isActive,
      createdAt: formatInTimeZone(
        activePrompt.createdAt,
        TIMEZONE_VIETNAM,
        DATE_TIME_PATTERN,
      ),
      updatedAt: formatInTimeZone(
        activePrompt.updatedAt,
        TIMEZONE_VIETNAM,
        DATE_TIME_PATTERN,
      ),
    };

    // Cache the result (CACHE_DURATION is already in milliseconds)
    await this.cacheManager.set(cacheKey, response, CACHE_DURATION);

    return response;
  }

  async updateSystemPrompt(
    id: number,
    request: SystemPromptUpdateRequestDto,
  ): Promise<void> {
    const existingPrompt = await this.systemPromptRepository.findOne({
      where: { id },
    });

    if (!existingPrompt) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'System Prompt');
    }

    // If the updated prompt is set to active, deactivate the current active prompt
    if (request.isActive === true) {
      await this.deactivateSystemPrompt();
    } else if (existingPrompt.isActive && request.isActive === false) {
      // Prevent deactivating the only active prompt
      throw new AppException(ErrorCode.SYSTEM_PROMPT_CANNOT_DEACTIVATE);
    }

    // Fetch the latest version to determine the new version number
    const latestVersion = await this.systemPromptRepository.findOne({
      order: { version: 'DESC' },
    });

    const newVersion = latestVersion
      ? latestVersion.version + 1
      : existingPrompt.version + 1;

    // Create a new SystemPrompt entity with updated details and incremented version
    const systemPrompt = this.systemPromptRepository.create({
      content: request.content ?? existingPrompt.content,
      version: newVersion,
      isActive: request.isActive ?? existingPrompt.isActive,
    });

    await this.systemPromptRepository.save(systemPrompt);

    // If the new system prompt is active, update cache
    if (systemPrompt.isActive) {
      await this.updateActivePromptCache(systemPrompt);
    }
  }

  async createSystemPrompt(
    request: SystemPromptCreateRequestDto,
  ): Promise<void> {
    // Deactivate the current active prompt
    await this.deactivateSystemPrompt();

    // Fetch the latest version to determine the new version number
    const latestVersion = await this.systemPromptRepository.findOne({
      order: { version: 'DESC' },
    });

    // Create and save the new system prompt as active
    const newPrompt = this.systemPromptRepository.create({
      version: latestVersion ? latestVersion.version + 1 : 1,
      content: request.content,
      isActive: true,
    });

    await this.systemPromptRepository.save(newPrompt);

    // Update cache with the new active prompt
    await this.updateActivePromptCache(newPrompt);
  }

  async changeActive(id: number): Promise<void> {
    const existingPrompt = await this.systemPromptRepository.findOne({
      where: { id },
    });

    if (!existingPrompt) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'System Prompt');
    }

    // If the prompt is not active, activate it and deactivate others
    if (!existingPrompt.isActive) {
      await this.deactivateSystemPrompt();
      existingPrompt.isActive = true;
      await this.systemPromptRepository.save(existingPrompt);

      // Update cache with the new active prompt
      await this.updateActivePromptCache(existingPrompt);
    } else {
      // Prevent deactivating the only active prompt
      throw new AppException(ErrorCode.SYSTEM_PROMPT_CANNOT_DEACTIVATE);
    }
  }

  private async deactivateSystemPrompt(): Promise<void> {
    const activePrompt = await this.systemPromptRepository.findOne({
      where: { isActive: true },
    });

    // Deactivate the current active prompt if it exists
    if (activePrompt) {
      activePrompt.isActive = false;
      await this.systemPromptRepository.save(activePrompt);

      // Remove the active prompt from cache
      const cacheKey = `${SYSTEM_PROMPT_CACHE}:${ACTIVE_PROMPT_KEY}`;
      await this.cacheManager.del(cacheKey);
    }
  }

  private async updateActivePromptCache(
    activePrompt: SystemPrompt,
  ): Promise<void> {
    // Cache the new active prompt
    const response: SystemPromptDetailResponseDto = {
      id: activePrompt.id,
      content: activePrompt.content,
      version: activePrompt.version,
      isActive: activePrompt.isActive,
      createdAt: formatInTimeZone(
        activePrompt.createdAt,
        TIMEZONE_VIETNAM,
        DATE_TIME_PATTERN,
      ),
      updatedAt: formatInTimeZone(
        activePrompt.updatedAt,
        TIMEZONE_VIETNAM,
        DATE_TIME_PATTERN,
      ),
    };

    const cacheKey = `${SYSTEM_PROMPT_CACHE}:${ACTIVE_PROMPT_KEY}`;
    await this.cacheManager.set(cacheKey, response, CACHE_DURATION);
  }
}

