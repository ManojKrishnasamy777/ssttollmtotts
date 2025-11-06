import { STTFactoryService } from './stt-factory.service';
import { OpenAIService } from './openai.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ConversationService } from '../conversation/conversation.service';
export declare class StreamService {
    private sttFactory;
    private openaiService;
    private elevenlabsService;
    private conversationService;
    private connections;
    private readonly VAD_THRESHOLD;
    constructor(sttFactory: STTFactoryService, openaiService: OpenAIService, elevenlabsService: ElevenLabsService, conversationService: ConversationService);
    registerClient(userId: string, eventCallback: (event: any) => void): Promise<void>;
    private processTranscript;
    private handleInterrupt;
    processAudio(userId: string, audioData: Buffer): Promise<void>;
    private calculateRMS;
    unregisterClient(userId: string): Promise<void>;
    endCall(userId: string): Promise<void>;
    private startCleanupTask;
}
