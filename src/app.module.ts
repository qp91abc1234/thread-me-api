import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UserModule } from './modules/user/user.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RespInterceptor } from './common/interceptor/resp.interceptor';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { JwtModule } from '@nestjs/jwt';
import { utilities, WinstonModule } from 'nest-winston';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { CommonExceptionFilter } from './common/filter/common-exception.filter';
import { JwtGuard } from './common/guard/jwt.guard';
import { PermissionGuard } from './common/guard/permission.guard';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { LangchainModule } from './modules/langchain/langchain.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { PrismaClientExceptionFilter } from './common/filter/prisma-exception.filter';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageModule } from './infrastructure/throttler-storage/throttler-storage.module';
import { ThrottlerStorageService } from './infrastructure/throttler-storage/throttler-storage.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      /**
       * 环境变量加载配置
       * @see docs/technical-notes.md#环境变量加载机制
       */
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory(config: ConfigService) {
        return {
          secret: config.get('JWT_SECRET'),
        };
      },
      inject: [ConfigService],
    }),
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isProduction = process.env.NODE_ENV === 'production';
        return {
          transports: [
            new winston.transports.DailyRotateFile({
              level: 'info',
              dirname: isProduction ? 'daily-prod-log' : 'daily-dev-log',
              filename: 'log-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              maxFiles: configService.get('WINSTON_MAX_FILES'),
              maxSize: configService.get('WINSTON_MAX_SIZE'),
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
            new winston.transports.Console({
              level: isProduction ? 'info' : 'debug',
              format: winston.format.combine(
                winston.format.timestamp(),
                utilities.format.nestLike(),
              ),
            }),
          ],
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ThrottlerStorageModule],
      inject: [ConfigService, ThrottlerStorageService],
      useFactory: (
        config: ConfigService,
        storage: ThrottlerStorageService,
      ) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL', 60) * 1000, // 时间窗口（毫秒）
            limit: config.get('THROTTLE_LIMIT', 100), // 限制次数
          },
        ],
        storage,
      }),
    }),
    PrismaModule,
    RedisModule,
    ThrottlerStorageModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    FileUploadModule,
    LangchainModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RespInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
    {
      provide: APP_FILTER,
      useClass: CommonExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
