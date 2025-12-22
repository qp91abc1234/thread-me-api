import { Module } from '@nestjs/common';
import { LangchainController } from './langchain.controller';
import { VectorStoreService } from './service/vector-store.service';
import { LlmService } from './service/llm.service';
import { SummaryChainService } from './service/summaryChain.service';
import { RagChainService } from './service/ragChain.service';

@Module({
  controllers: [LangchainController],
  providers: [
    VectorStoreService,
    LlmService,
    RagChainService,
    SummaryChainService,
  ],
})
export class LangchainModule {}
