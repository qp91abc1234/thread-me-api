import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as OSS from 'ali-oss';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import {
  OssInfoVo,
  UploadChunkDto,
  UploadFilesDto,
} from './vo/file-upload.dto';
import { multerOptions, uploadDest } from './common/config';

@ApiTags('file-upload')
@Controller('file-upload')
export class FileUploadController {
  private uploadBaseUrl: string;
  private ossClient: OSS;

  constructor(private readonly configService: ConfigService) {
    this.uploadBaseUrl = `${this.configService.get('APP_URL')}/static/upload/`;
    this.ossClient = new OSS({
      region: this.configService.get('OSS_REGION'),
      bucket: this.configService.get('OSS_BUCKET'),
      accessKeyId: this.configService.get('OSS_ACCESS_KEY_ID'),
      accessKeySecret: this.configService.get('OSS_ACCESS_KEY_SECRET'),
    });
  }

  @Post('uploadFiles')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor(multerOptions.uploadFiles))
  uploadFiles(
    @Body() body: UploadFilesDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const fileUrls = files.map((val) => `${this.uploadBaseUrl}${val.filename}`);
    return fileUrls;
  }

  @Post('uploadChunk')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions.uploadChunk))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadChunkDto,
  ) {
    const fileName = body.name.match(/(.+)\-\d+$/)[1];
    const chunkDir = `${uploadDest}chunks_${fileName}`;
    await fs.promises.mkdir(chunkDir, { recursive: true }); // 自动判断存在
    await fs.promises.rename(file.path, chunkDir + '/' + body.name);
  }

  @Get('merge')
  async merge(@Query('name') name: string) {
    const dest = `${uploadDest}${name}`;
    const chunkDir = `${uploadDest}chunks_${name}`;
    const files = await fs.promises.readdir(chunkDir);

    // 1. 排序文件，确保顺序正确
    files.sort((a, b) => {
      const aNum = parseInt(a.match(/\-(\d+)$/)[1]);
      const bNum = parseInt(b.match(/\-(\d+)$/)[1]);
      return aNum - bNum;
    });

    let startPos = 0;

    // 2. 顺序处理每个块
    for (const file of files) {
      const filePath = `${chunkDir}/${file}`;
      const stat = await fs.promises.stat(filePath);

      // 3. 等待每个流完成
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(
            fs.createWriteStream(dest, {
              start: startPos,
              flags: 'a', // append 模式
            }),
          )
          .on('finish', resolve)
          .on('error', reject);
      });

      startPos += stat.size;
    }

    // 4. 合并完成后删除临时目录
    await fs.promises.rm(chunkDir, { recursive: true });

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

    const host = `http://${this.configService.get('OSS_BUCKET')}.${this.configService.get('OSS_REGION')}.aliyuncs.com/img`;
    return {
      ...res,
      host,
    };
  }
}
