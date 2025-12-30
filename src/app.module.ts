import { join } from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { utilities, WinstonModule } from 'nest-winston';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ThrottlerStorageModule } from './infrastructure/throttler-storage/throttler-storage.module';
import { ThrottlerStorageService } from './infrastructure/throttler-storage/throttler-storage.service';
import { CommonExceptionFilter } from './common/filter/common-exception.filter';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { PrismaClientExceptionFilter } from './common/filter/prisma-exception.filter';
import { JwtGuard } from './common/guard/jwt.guard';
import { PermissionGuard } from './common/guard/permission.guard';
import { RespInterceptor } from './common/interceptor/resp.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { AuthModule } from './modules/auth/auth.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';

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
    // AuthModule,
    FileUploadModule,
    UserModule,
    RoleModule,
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
