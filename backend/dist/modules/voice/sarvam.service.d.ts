import { ConfigService } from '@nestjs/config';
export declare class SarvamService {
    private configService;
    private apiKey;
    private wsUrl;
    constructor(configService: ConfigService);
    createLiveTranscription(onTranscript: (text: string) => void, onError: (error: any) => void): Promise<import("ws")>;
    sendAudio(connection: any, audioData: Buffer): void;
    closeConnection(connection: any): void;
}
