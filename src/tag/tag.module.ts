import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from '../entities/tag.entity';
import { Part } from '../entities/part.entity';
import { TagService } from './tag.service';
import { AdminTagController } from './admin-tag.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Part]), AuthModule],
  controllers: [AdminTagController],
  providers: [TagService],
  exports: [TagService], // cho phép module khác inject TagService
})
export class TagModule {}
