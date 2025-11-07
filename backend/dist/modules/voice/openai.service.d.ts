import { ConfigService } from '@nestjs/config';
import { LLMService } from './llm.interface';
export declare class OpenAIService implements LLMService {
    private configService;
    private openai;
    private userConversations;
    private firstMessageVariants;
    constructor(configService: ConfigService);
    private getRandomFirstMessage;
    generateResponse(userId: string, messages?: Array<{
        role: string;
        content: string;
    }>, clientType?: 'buyer' | 'seller' | 'renter'): Promise<string>;
}
