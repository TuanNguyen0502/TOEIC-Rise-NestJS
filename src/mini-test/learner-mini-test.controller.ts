import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { TagService } from '../tag/tag.service';
import { MiniTestService } from './mini-test.service';
import { QuestionGroupService } from '../question-group/question-group.service';
import { TagByPartResponse } from '../tag/dto/tag-by-part-response.dto';
import { MiniTestResponse } from './dto/mini-test-response.dto';
import { MiniTestRequest } from './dto/mini-test-request.dto';
import { MiniTestOverallResponse } from './dto/mini-test-overall-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { ParseArrayPipe, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';

@Controller('learner/mini-tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.LEARNER)
export class LearnerMiniTestController {
  constructor(
    private readonly tagService: TagService,
    private readonly miniTestService: MiniTestService,
    private readonly questionGroupService: QuestionGroupService,
  ) {}

  @Get()
  async getQuestionByPart(
    @Query('partId', new DefaultValuePipe(1), ParseIntPipe) partId: number,
    @Query('tagIds', new ParseArrayPipe({ items: Number, separator: ',' }))
    tagIds: number[],
    @Query('numberQuestion', new DefaultValuePipe(5), ParseIntPipe)
    numberQuestion: number,
  ): Promise<MiniTestResponse> {
    if (partId < 1 || partId > 7) {
      throw new Error('Part ID must be between 1 and 7');
    }

    if (tagIds.length < 1 || tagIds.length > 3) {
      throw new Error('Tag IDs must contain between 1 and 3 items');
    }

    if (numberQuestion < 5 || numberQuestion > 60) {
      throw new Error('Number of questions must be between 5 and 60');
    }

    const tagIdSet = new Set(tagIds);
    return this.miniTestService.getLearnerTestQuestionGroupResponsesByTags(
      partId,
      tagIdSet,
      numberQuestion,
    );
  }

  @Get('tags')
  async getTagsByPartId(@Query('partId') partId: number): Promise<TagByPartResponse[]> {
    return this.tagService.getTagsByPartId(partId);
  }

  @Post()
  async submitTest(
    @Body() miniTestRequest: MiniTestRequest,
  ): Promise<MiniTestOverallResponse> {
    return this.questionGroupService.getMiniTestOverallResponse(miniTestRequest);
  }
}
