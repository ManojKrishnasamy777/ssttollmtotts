import { ConfigService } from '@nestjs/config';
export declare class ElevenLabsService {
    private configService;
    private apiKey;
    private voiceId;
    constructor(configService: ConfigService);
    textToSpeech(text: string): Promise<Buffer>;
}
