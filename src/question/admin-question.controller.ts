import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ERole } from 'src/enums/ERole.enum';
import { QuestionRequestDto } from './dto/question-request.dto';
import { QuestionResponseDto } from './dto/question-response.dto';

@ApiTags('admin/questions')
@ApiBearerAuth('JWT')
@Controller('admin/questions')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT and Roles guards
@Roles(ERole.ADMIN) // ONLY Admin can access
export class AdminQuestionController {
  constructor(private readonly questionService: QuestionService) {}

  /**
   * Corresponds to:
   * @PutMapping("")
   * public ResponseEntity<?> updateQuestion(...)
   * [ADMIN role required]
   */
  @Put()
  @HttpCode(HttpStatus.OK) // Corresponds to ResponseEntity.ok()
  async updateQuestion(@Body() dto: QuestionRequestDto) {
    await this.questionService.updateQuestion(dto);
    return { message: 'Update question updated successfully' };
  }

  /**
   * Corresponds to:
   * @GetMapping("/{id}")
   * public ResponseEntity<?> getQuestionById(@PathVariable Long id)
   * [ADMIN role required]
   */
  @Get(':id')
  async getQuestionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuestionResponseDto> {
    return this.questionService.getQuestionById(id);
  }
}
