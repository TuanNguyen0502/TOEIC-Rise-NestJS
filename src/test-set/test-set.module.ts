import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSet } from 'src/entities/test-set.entity';
import { TestSetService } from './test-set.service';
import { TestSetController } from './test-set.controller';
import { TestModule } from 'src/test/test.module';
import { AdminTestSetController } from './admin-test-set.controller';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { TestSetMapper } from './mapper/test-set.mapper';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestSet]),
    forwardRef(() => TestModule),
    AuthModule,
  ],
  controllers: [TestSetController, AdminTestSetController],
  providers: [TestSetService, RolesGuard, TestSetMapper],
  exports: [TestSetService],
})
export class TestSetModule {}
