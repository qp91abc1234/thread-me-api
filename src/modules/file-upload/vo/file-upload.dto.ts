import { ApiProperty } from '@nestjs/swagger';

export class UploadFilesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string', // 数组元素类型
      format: 'binary', // 格式标记为 binary：对 type 的进一步说明，用于文档构建
    },
    description: '支持上传多个文件（图片格式：jpeg、png、gif、webp）',
  })
  files: string[];
}

export class UploadChunkDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '文件块',
  })
  file: string;

  @ApiProperty({
    type: 'string',
    description: '文件块名称',
  })
  name: string;
}

export class OssInfoVo {
  policy: string;
  OSSAccessKeyId: string;
  Signature: string;
  host: string;
}
