// test-excel.mapper.ts

import { QuestionExcelRequestDto } from '../dto/question-excel-request.dto';

// Mỗi row là một mảng các ô trong Excel
export type ExcelRow = Array<string | number | null>;

export class TestExcelMapper {
  mapRowToDTO(row: ExcelRow): QuestionExcelRequestDto | null {
    if (!row || row.length === 0) {
      return null;
    }

    const partNumber = this.getCellValueAsInteger(row[0]);
    const questionGroupId = this.getCellValueAsString(row[1]);
    const numberOfQuestions = this.getCellValueAsInteger(row[2]);
    const passageText = this.getCellValueAsString(row[3]);
    const question = this.getCellValueAsString(row[4]);
    const optionA = this.getCellValueAsString(row[5]);
    const optionB = this.getCellValueAsString(row[6]);
    const optionC = this.getCellValueAsString(row[7]);
    const optionD = this.getCellValueAsString(row[8]);
    const correctAnswer = this.getCellValueAsString(
      this.getCellValueAsString(row[9]),
    );
    const audioUrl = this.getCellValueAsString(row[10]);
    const imageUrl = this.getCellValueAsString(row[11]);
    const tags = this.getCellValueAsString(row[12]);
    const explanation = this.getCellValueAsString(row[13]);
    const transcript = this.getCellValueAsString(row[14]);

    // Điều kiện bỏ row trống (giống logic bạn đang dùng)
    if (!question && !passageText) {
      return null;
    }

    const dto: QuestionExcelRequestDto = {
      partNumber,
      questionGroupId,
      numberOfQuestions,
      passageText,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      audioUrl,
      imageUrl,
      tags,
      explanation,
      transcript,
    };

    return dto;
  }

  private getCellValueAsString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return null;
  }

  private getCellValueAsInteger(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number') {
      // Nếu là số (đọc từ Excel) thì làm tròn luôn
      const intVal = Math.trunc(value);
      return Number.isNaN(intVal) ? null : intVal;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }
}
