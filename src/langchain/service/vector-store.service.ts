import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';
import { MultiQueryRetriever } from 'langchain/retrievers/multi_query';
import { ScoreThresholdRetriever } from 'langchain/retrievers/score_threshold';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { LlmService } from './llm.service';
import { existsSync } from 'node:fs';
import { Document } from '@langchain/core/documents';
import { BaseRetriever } from '@langchain/core/retrievers';

@Injectable()
export class VectorStoreService {
  private embeddings: AlibabaTongyiEmbeddings;
  private vectorStore: FaissStore;

  constructor(
    private readonly config: ConfigService,
    private readonly llmService: LlmService,
  ) {
    this.embeddings = new AlibabaTongyiEmbeddings({
      apiKey: this.config.get('ALI_KEY'),
    });
  }

  private getStorePath(path: string) {
    const arr = path.split(/[\\|/]/);
    const key = arr[arr.length - 1].split('.')[0];
    return `data/${key}`;
  }

  private convertDocsToString(documents: Document[]) {
    return documents.map((document) => document.pageContent).join('\n');
  }

  async loadText(
    path: string,
    opts?: { chunkSize?: number; chunkOverlap?: number; override?: boolean },
  ) {
    opts = opts || {};
    opts.chunkSize = opts.chunkSize || 100;
    opts.chunkOverlap = opts.chunkOverlap || 20;
    opts.override = opts.override || false;

    const storePath = this.getStorePath(path);
    if (existsSync(storePath) && !opts.override) {
      this.vectorStore = await FaissStore.load(storePath, this.embeddings);
    } else {
      const loader = new TextLoader(path);
      const docs = await loader.load();

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: opts.chunkSize,
        chunkOverlap: opts.chunkOverlap,
      });

      const splitDocs = await splitter.splitDocuments(docs);

      this.vectorStore = await FaissStore.fromDocuments(
        splitDocs,
        this.embeddings,
      );

      await this.vectorStore.save(storePath);
    }
  }

  async retriever(
    query: string,
    opts?: {
      easy?: boolean;
      compress?: boolean;
    },
  ): Promise<string> {
    opts = opts || {};
    opts.easy = opts.easy || true;
    opts.compress = opts.compress || false;

    if (opts.easy) {
      const retriever = this.vectorStore.asRetriever(2);
      const docs = await retriever.invoke(query);
      return this.convertDocsToString(docs);
    }

    const scoreThresholdRetriever = ScoreThresholdRetriever.fromVectorStore(
      this.vectorStore,
      {
        minSimilarityScore: 0.8,
        maxK: 15,
        kIncrement: 3,
      },
    );

    const multiQueryRetriever = MultiQueryRetriever.fromLLM({
      llm: this.llmService.qwen,
      retriever: scoreThresholdRetriever,
      queryCount: 3,
      verbose: false,
    });

    let finalRetriever: BaseRetriever = multiQueryRetriever;
    if (opts.compress) {
      const compressor = LLMChainExtractor.fromLLM(this.llmService.openai);
      const contextualCompressionRetriever = new ContextualCompressionRetriever(
        {
          baseCompressor: compressor,
          baseRetriever: multiQueryRetriever,
        },
      );
      finalRetriever = contextualCompressionRetriever;
    }

    const docs = await finalRetriever.invoke(query);
    return this.convertDocsToString(docs);
  }
}
