import { IsNotEmpty, IsString } from 'class-validator';

export class RagDto {
  @IsNotEmpty()
  @IsString()
  question: string;
}
