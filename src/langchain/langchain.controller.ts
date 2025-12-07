import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SummaryChainService } from './service/summaryChain.service';
import { RagChainService } from './service/ragChain.service';
import { RagDto } from './dto/langchain.dto';
import { PROMPT_TEMPLATE } from './common/template';
import { RunnableSequence } from '@langchain/core/runnables';

@ApiTags('langchain')
@Controller('langchain')
export class LangchainController {
  chain: RunnableSequence;

  constructor(
    private readonly ragChainService: RagChainService,
    private readonly summaryChainService: SummaryChainService,
  ) {}

  @Post('init')
  async init() {
    const ragChain = await this.ragChainService.init({
      filePath: 'data/kong.txt',
      template: PROMPT_TEMPLATE,
    });
    this.chain = this.summaryChainService.runWithSumary(ragChain);
  }

  @Post('rag')
  async rag(@Body() ragDto: RagDto) {
    return await this.chain.invoke(ragDto.question);
  }
}
