import { Controller, Get, Param, UseGuards, Put, Body } from '@nestjs/common';
import { QuestionGroupService } from './question-group.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { QuestionGroupResponseDto } from './dto/question-group-response.dto';

@Controller('admin/question-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN) // Chỉ ADMIN mới truy cập được
export class AdminQuestionGroupController {
  constructor(private readonly questionGroupService: QuestionGroupService) {}

  @Get(':id')
  async getQuestionGroup(
    @Param('id') id: number,
  ): Promise<QuestionGroupResponseDto> {
    return await this.questionGroupService.getQuestionGroupResponse(id);
  }
}
