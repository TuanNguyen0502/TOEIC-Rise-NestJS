import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { redisStore } from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { join } from 'path';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';
import { TestModule } from './test/test.module';
import { QuestionModule } from './question/question.module';
import { TestSetModule } from './test-set/test-set.module';
import { UserTestModule } from './user-test/user-test.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Set to true for dev, false for prod. We'll use migrations.
      }),
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_HOST'),
        port: config.get('REDIS_PORT'),
        ttl: 43200, // Time-to-live in seconds (12 hours)
      }),
      isGlobal: true,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SPRING_MAIL_HOST', 'smtp.gmail.com'),
          port: configService.get<number>('SPRING_MAIL_PORT', 587),
          secure: false, // true cho port 465, false cho các port khác
          auth: {
            user: configService.get<string>('SUPPORT_EMAIL'),
            pass: configService.get<string>('APP_PASSWORD'),
          },
        },
        defaults: {
          from: `"TOEIC Rise" <${configService.get<string>('SUPPORT_EMAIL')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'), // Trỏ đến thư mục templates
          adapter: new HandlebarsAdapter(), // Sử dụng Handlebars
          options: {
            strict: true,
          },
        },
      }),
    }),
    AuthModule,
    RoleModule,
    UserModule,
    TestModule,
    QuestionModule,
    TestSetModule,
    UserTestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
