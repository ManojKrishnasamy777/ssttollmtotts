import { ConfigService } from '@nestjs/config';
import { STTService } from './stt.interface';
import WebSocket from 'ws';
export declare class SarvamService implements STTService {
    private configService;
    private apiKey;
    private endpoint;
    constructor(configService: ConfigService);
    createLiveTranscription(onTranscript: (text: string) => void, onError: (error: any) => void): Promise<WebSocket>;
    sendAudio(connection: WebSocket, audioData: Buffer): void;
    closeConnection(connection: WebSocket): void;
}
