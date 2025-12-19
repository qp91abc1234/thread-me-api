import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UserModule } from './user/user.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RespInterceptor } from './common/interceptor/resp.interceptor';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { JwtModule } from '@nestjs/jwt';
import { utilities, WinstonModule } from 'nest-winston';
import { FileUploadModule } from './file-upload/file-upload.module';
import { PermissionModule } from './permission/permission.module';
import { RoleModule } from './role/role.module';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { CommonExceptionFilter } from './common/filter/common-exception.filter';
import { JwtGuard } from './common/guard/jwt.guard';
import { PermissionGuard } from './common/guard/permission.guard';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { LangchainModule } from './langchain/langchain.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaClientExceptionFilter } from './common/filter/prisma-exception.filter';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
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
      useFactory: (configService: ConfigService) => ({
        transports: [
          new winston.transports.DailyRotateFile({
            level: configService.get('WINSTON_LEVEL'),
            dirname: configService.get('WINSTON_DIRNAME'),
            filename: configService.get('WINSTON_FILENAME'),
            datePattern: configService.get('WINSTON_DATE_PATTERN'),
            maxSize: configService.get('WINSTON_MAX_SIZE'),
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
          new winston.transports.Console({
            level: configService.get('WINSTON_LEVEL'),
            format: winston.format.combine(
              winston.format.timestamp(),
              utilities.format.nestLike(),
            ),
          }),
        ],
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    UserModule,
    FileUploadModule,
    PermissionModule,
    RoleModule,
    AuthModule,
    LangchainModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
