import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TagService } from '../tag/tag.service';
import { TagByPartResponse } from '../tag/dto/tag-by-part-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';

@Controller('learner/mini-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.LEARNER)
export class LearnerMiniTestController {
  constructor(private readonly tagService: TagService) {}

  @Get('tags')
  async getTagsByPartId(@Query('partId') partId: number): Promise<TagByPartResponse[]> {
    return this.tagService.getTagsByPartId(partId);
  }
}
