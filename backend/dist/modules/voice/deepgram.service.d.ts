import { ConfigService } from '@nestjs/config';
import { STTService } from './stt.interface';
export declare class DeepgramService implements STTService {
    private configService;
    private deepgram;
    constructor(configService: ConfigService);
    createLiveTranscription(onTranscript: (text: string) => void, onError: (error: any) => void): Promise<any>;
    sendAudio(connection: any, audioData: Buffer): void;
    closeConnection(connection: any): void;
}
