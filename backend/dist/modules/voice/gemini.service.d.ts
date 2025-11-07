import { ConfigService } from '@nestjs/config';
import { LLMService } from './llm.interface';
export declare class GeminiService implements LLMService {
    private configService;
    private apiKey;
    private userConversations;
    private firstMessageVariants;
    constructor(configService: ConfigService);
    private getRandomFirstMessage;
    private convertMessagesToGeminiFormat;
    generateResponse(userId: string, messages?: Array<{
        role: string;
        content: string;
    }>, clientType?: 'buyer' | 'seller' | 'renter'): Promise<string>;
}
