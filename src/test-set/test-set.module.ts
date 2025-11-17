import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSet } from 'src/entities/test-set.entity';
import { TestSetService } from './test-set.service';
import { TestSetController } from './test-set.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TestSet])],
  controllers: [TestSetController],
  providers: [TestSetService],
  exports: [TestSetService],
})
export class TestSetModule {}
