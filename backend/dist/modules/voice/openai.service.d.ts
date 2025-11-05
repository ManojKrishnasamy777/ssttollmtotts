import { ConfigService } from '@nestjs/config';
export declare class OpenAIService {
    private configService;
    private openai;
    constructor(configService: ConfigService);
    generateResponse(messages: Array<{
        role: string;
        content: string;
    }>): Promise<string>;
}
