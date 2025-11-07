import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { GeminiService } from './gemini.service';
import { LLMService } from './llm.interface';
export declare class LLMFactoryService {
    private configService;
    private openaiService;
    private geminiService;
    constructor(configService: ConfigService, openaiService: OpenAIService, geminiService: GeminiService);
    getLLMService(): LLMService;
}
