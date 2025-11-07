import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { GeminiService } from './gemini.service';
import { LLMService } from './llm.interface';

@Injectable()
export class LLMFactoryService {
  constructor(
    private configService: ConfigService,
    private openaiService: OpenAIService,
    private geminiService: GeminiService,
  ) {}

  getLLMService(): LLMService {
    const provider = this.configService.get('LLM_PROVIDER') || 'openai';
    console.log(`Using LLM provider: ${provider}`);

    switch (provider.toLowerCase()) {
      case 'gemini':
        return this.geminiService;
      case 'openai':
      default:
        return this.openaiService;
    }
  }
}
