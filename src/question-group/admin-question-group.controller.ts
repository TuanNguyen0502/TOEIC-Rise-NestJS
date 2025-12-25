import {
  Controller,
  Get,
  Param,
  UseGuards,
  Put,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { QuestionGroupService } from './question-group.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { QuestionGroupResponseDto } from './dto/question-group-response.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { QuestionGroupUpdateRequestDto } from './dto/question-group-update-request.dto';

@Controller('admin/question-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN, ERole.STAFF)
export class AdminQuestionGroupController {
  constructor(private readonly questionGroupService: QuestionGroupService) {}

  @Get(':id')
  async getQuestionGroup(
    @Param('id') id: number,
  ): Promise<QuestionGroupResponseDto> {
    return await this.questionGroupService.getQuestionGroupResponse(id);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'audio', maxCount: 1 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  async updateQuestionGroup(
    @Param('id') id: number,
    @Body() dto: QuestionGroupUpdateRequestDto,
    @UploadedFiles()
    files: {
      audio?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
  ) {
    // files có thể là object rỗng {} nếu không upload gì
    await this.questionGroupService.updateQuestionGroup(id, dto, files || {});
    return { message: 'Update successful' };
  }
}
