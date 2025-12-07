import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { storage } from './common/storage';
import { httpExceptionMap } from '../common/utils/execption';
import { ConfigService } from '@nestjs/config';
import { allowFileType, maxFileSize } from './common/constant';
import * as OSS from 'ali-oss';
import { ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import { uploadDest } from './common/constant';
import { OssInfoVo } from './vo/file-upload.dto';

@ApiTags('file-upload')
@Controller('file-upload')
export class FileUploadController {
  private uploadBaseUrl: string;
  private ossClient: OSS;

  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly config: ConfigService,
  ) {
    this.uploadBaseUrl = `${this.config.get('APP_URL')}/static/upload/`;
    this.ossClient = new OSS({
      region: this.config.get('OSS_REGION'),
      bucket: this.config.get('OSS_BUCKET'),
      accessKeyId: this.config.get('OSS_ACCESS_KEY_ID'),
      accessKeySecret: this.config.get('OSS_ACCESS_KEY_SECRET'),
    });
  }

  @Post('uploadFiles')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: storage,
      limits: {
        fileSize: maxFileSize,
      },
      fileFilter(req, file, cb) {
        if (!file.mimetype.match(allowFileType)) {
          cb(httpExceptionMap.UNSUPPORT_FILE_TYPE(), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    const fileUrls = files.map((val) => `${this.uploadBaseUrl}${val.filename}`);
    return fileUrls;
  }

  @Post('uploadLargeFile')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: storage,
    }),
  )
  uploadLargeFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: { name: string },
  ) {
    const fileName = body.name.match(/(.+)\-\d+$/)[1];
    const chunkDir = `${uploadDest}chunks_${fileName}`;

    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir);
    }
    fs.cpSync(files[0].path, chunkDir + '/' + body.name);
    fs.rmSync(files[0].path);
  }

  @Get('merge')
  merge(@Query('name') name: string) {
    const dest = `${uploadDest}${name}`;
    const chunkDir = `${uploadDest}chunks_${name}`;
    const files = fs.readdirSync(chunkDir);

    let count = 0;
    let startPos = 0;
    files.forEach((file) => {
      const filePath = chunkDir + '/' + file;
      const stream = fs.createReadStream(filePath);
      stream
        .pipe(
          fs.createWriteStream(dest, {
            start: startPos,
          }),
        )
        .on('finish', () => {
          count++;
          if (count === files.length) {
            fs.rm(
              chunkDir,
              {
                recursive: true,
              },
              () => {},
            );
          }
        });

      startPos += fs.statSync(filePath).size;
    });
    return `${this.uploadBaseUrl}${name}`;
  }

  @Get('ossInfo')
  getOssInfo(): OssInfoVo {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const res: any = this.ossClient.calculatePostSignature({
      expiration: date.toISOString(),
      conditions: [
        ['content-length-range', 0, 1024 * 1024 * 1000], //设置上传文件的大小限制。
      ],
    });

    const host = `http://${this.config.get('OSS_BUCKET')}.${this.config.get('OSS_REGION')}.aliyuncs.com/img`;
    return {
      ...res,
      host,
    };
  }
}
