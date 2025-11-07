import { STTFactoryService } from './stt-factory.service';
import { LLMFactoryService } from './llm-factory.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ConversationService } from '../conversation/conversation.service';
export declare class StreamService {
    private sttFactory;
    private llmFactory;
    private elevenlabsService;
    private conversationService;
    private connections;
    private readonly VAD_THRESHOLD;
    constructor(sttFactory: STTFactoryService, llmFactory: LLMFactoryService, elevenlabsService: ElevenLabsService, conversationService: ConversationService);
    registerClient(userId: string, eventCallback: (event: any) => void): Promise<void>;
    processAudio(userId: string, audioData: Buffer): Promise<void>;
    private calculateRMS;
    unregisterClient(userId: string): Promise<void>;
    endCall(userId: string): Promise<void>;
    private startCleanupTask;
}
