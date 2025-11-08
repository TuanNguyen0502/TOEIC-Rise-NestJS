import { ApiProperty } from '@nestjs/swagger';

export class ExceptionResponse {
  @ApiProperty()
  path: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  code: number;

  @ApiProperty()
  message: any;

  @ApiProperty({
    type: String,
    example: '2025-01-15 14:30:00',
  })
  timestamp: string;

  constructor();
  constructor(partial: Partial<ExceptionResponse>);
  constructor(partial?: Partial<ExceptionResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
