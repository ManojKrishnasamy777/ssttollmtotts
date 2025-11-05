import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DeepgramService } from './deepgram.service';
import { OpenAIService } from './openai.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ConversationService } from '../conversation/conversation.service';
export declare class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private deepgramService;
    private openaiService;
    private elevenlabsService;
    private conversationService;
    server: Server;
    private activeConnections;
    constructor(deepgramService: DeepgramService, openaiService: OpenAIService, elevenlabsService: ElevenLabsService, conversationService: ConversationService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleAudioData(data: any, client: Socket): void;
    handleStopSpeaking(client: Socket): void;
}
