import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTest } from '../entities/user-test.entity';
import { UserTestService } from './user-test.service';
import { UserTestController } from './user-test.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserTest]), AuthModule],
  controllers: [UserTestController],
  providers: [UserTestService],
  exports: [UserTestService],
})
export class UserTestModule {}
