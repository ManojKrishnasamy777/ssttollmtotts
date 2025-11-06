import { ConfigService } from '@nestjs/config';
export declare class OpenAIService {
    private configService;
    private openai;
    private userConversations;
    private firstMessageVariants;
    constructor(configService: ConfigService);
    private getRandomFirstMessage;
    private detectComplexity;
    generateResponse(userId: string, messages?: Array<{
        role: string;
        content: string;
    }>, clientType?: 'buyer' | 'seller' | 'renter'): Promise<string>;
}
