import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Account } from 'src/entities/account.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import * as multer from 'multer';
import { MulterModule } from '@nestjs/platform-express';
import { AdminUserController } from './admin-user.controller';
import { RoleModule } from 'src/role/role.module';
import { Role } from 'src/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Role]),
    forwardRef(() => AuthModule),
    CloudinaryModule,
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
    RoleModule,
  ],
  providers: [UserService],
  controllers: [UserController, AdminUserController],
  exports: [UserService],
})
export class UserModule {}
