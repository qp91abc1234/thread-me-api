import { Injectable } from '@nestjs/common';
import { LlmService } from './llm.service';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SUMMARY_PROMPT_TEMPLATE } from '../common/template';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { getBufferString } from '@langchain/core/messages';

@Injectable()
export class SummaryChainService {
  private chatSummary = '';
  private chatHistory = new ChatMessageHistory();
  private summaryChain: RunnableSequence;

  constructor(private readonly llmService: LlmService) {
    this.summaryChain = RunnableSequence.from([
      SUMMARY_PROMPT_TEMPLATE,
      this.llmService.qwen,
      new StringOutputParser(),
    ]);
  }

  runWithSumary(chain: RunnableSequence) {
    return RunnableSequence.from([
      new RunnablePassthrough({
        func: (input) => {
          this.chatHistory.addUserMessage(input);
        },
      }),
      {
        question: (input) => input,
      },
      RunnablePassthrough.assign({
        history_summary: () => this.chatSummary,
      }),
      chain,
      new RunnablePassthrough({
        func: async (input) => {
          this.chatHistory.addAIMessage(input);
          const messages = await this.chatHistory.getMessages();
          const new_lines = getBufferString(messages);
          const newSummary = await this.summaryChain.invoke({
            summary: this.chatSummary,
            new_lines,
          });
          this.chatHistory.clear();
          this.chatSummary = newSummary;
        },
      }),
    ]);
  }
}
