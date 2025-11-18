import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Part } from 'src/entities/part.entity';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { AppException } from 'src/exceptions/app.exception';
import { Repository } from 'typeorm';

@Injectable()
export class PartService {
  constructor(
    @InjectRepository(Part)
    private readonly partRepository: Repository<Part>,
  ) {}

  async getPartById(id: number): Promise<Part> {
    if (!id) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Part id');
    }
    const part = await this.partRepository.findOne({
      where: { id },
    });
    if (!part) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Part');
    }
    return part;
  }
}
