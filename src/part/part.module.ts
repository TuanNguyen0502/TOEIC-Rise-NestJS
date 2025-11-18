import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Part } from '../entities/part.entity';
import { PartService } from './part.service';

@Module({
  imports: [TypeOrmModule.forFeature([Part])],
  providers: [PartService],
  exports: [PartService],
})
export class PartModule {}
