import { ConfigService } from '@nestjs/config';
import { STTService } from './stt.interface';
interface SarvamConnectionWrapper {
    connection: any;
    listener: Promise<void> | null;
    send: (audioData: Buffer) => Promise<void>;
    finish: () => Promise<void>;
    getReadyState: () => number;
}
export declare class SarvamService implements STTService {
    private configService;
    private sarvamClient;
    private readonly DEFAULT_LANGUAGE_CODE;
    constructor(configService: ConfigService);
    createLiveTranscription(onTranscript: (text: string) => void, onError: (error: any) => void): Promise<SarvamConnectionWrapper>;
    sendAudio(connection: SarvamConnectionWrapper, audioData: Buffer): void;
    closeConnection(connection: SarvamConnectionWrapper): void;
}
export {};
