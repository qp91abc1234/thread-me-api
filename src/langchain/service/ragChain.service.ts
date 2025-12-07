import { Injectable } from '@nestjs/common';
import { LlmService } from './llm.service';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { VectorStoreService } from './vector-store.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';

@Injectable()
export class RagChainService {
  constructor(
    private readonly llmService: LlmService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async init(params: { filePath: string; template: ChatPromptTemplate }) {
    await this.vectorStoreService.loadText(params.filePath);
    return RunnableSequence.from<
      { question: string; history_sumary: string },
      string
    >([
      RunnablePassthrough.assign({
        context: async (input) => {
          return await this.vectorStoreService.retriver(input.question);
        },
      }),
      params.template,
      this.llmService.qwen,
      new StringOutputParser(),
    ]);
  }
}
