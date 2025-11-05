import { ConfigService } from '@nestjs/config';
export declare class DeepgramService {
    private configService;
    private deepgram;
    constructor(configService: ConfigService);
    createLiveTranscription(onTranscript: (text: string) => void, onError: (error: any) => void): Promise<any>;
    sendAudio(connection: any, audioData: Buffer): void;
    closeConnection(connection: any): void;
}
