import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { PageResponse } from 'src/test-set/dto/page-response.dto';
import { TagResponseDto } from './dto/tag-response.dto';

@ApiTags('admin/tags')
@ApiBearerAuth('JWT')
@Controller('admin/tags')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT and Roles guards
@Roles(ERole.ADMIN) // ONLY Admin can access
export class AdminTagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async getAllTags(
    @Query('page') page = 0,
    @Query('size') size = 10,
    @Query('tagName') tagName = '',
  ): Promise<PageResponse<TagResponseDto[]>> {
    return await this.tagService.getAllTags(page, size, tagName || '');
  }
}
