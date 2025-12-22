import { ChatAlibabaTongyi } from '@langchain/community/chat_models/alibaba_tongyi';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
  openai: ChatOpenAI;
  qwen: ChatAlibabaTongyi;

  constructor(private readonly config: ConfigService) {
    this.openai = new ChatOpenAI({
      model: 'gpt-4o-mini',
      configuration: {
        apiKey: this.config.get('OPENAI_PROXY_KEY'),
        baseURL: this.config.get('OPENAI_PROXY_URL'),
      },
    });
    this.qwen = new ChatAlibabaTongyi({
      model: 'qwen-turbo',
      alibabaApiKey: this.config.get('ALI_KEY'),
    });
  }
}
