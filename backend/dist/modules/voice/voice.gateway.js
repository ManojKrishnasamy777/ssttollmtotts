"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const stt_factory_service_1 = require("./stt-factory.service");
const openai_service_1 = require("./openai.service");
const elevenlabs_service_1 = require("./elevenlabs.service");
const conversation_service_1 = require("../conversation/conversation.service");
let VoiceGateway = class VoiceGateway {
    constructor(sttFactory, openaiService, elevenlabsService, conversationService) {
        this.sttFactory = sttFactory;
        this.openaiService = openaiService;
        this.elevenlabsService = elevenlabsService;
        this.conversationService = conversationService;
        this.activeConnections = new Map();
    }
    async handleConnection(client) {
        console.log(`[WS] Client connected: ${client.id}`);
        try {
            const conversationId = await this.conversationService.createConversation(client.id);
            console.log(`[WS] Created conversation: ${conversationId} for client: ${client.id}`);
            const audioQueue = [];
            const sttService = this.sttFactory.getSTTService();
            const sttConnection = await sttService.createLiveTranscription(async (transcript) => {
                console.log(`[STT] Transcript received: "${transcript}"`);
                client.emit('transcript', { text: transcript });
                await this.conversationService.addMessage(conversationId, 'user', transcript);
                console.log(`[Conversation] User message saved: "${transcript}"`);
                const messages = await this.conversationService.getConversationHistory(conversationId);
                console.log('[Conversation] Full conversation history:', messages);
                const aiResponse = await this.openaiService.generateResponse(messages);
                console.log(`[OpenAI] Response generated: "${aiResponse}"`);
                await this.conversationService.addMessage(conversationId, 'assistant', aiResponse);
                console.log('[Conversation] Assistant message saved');
                client.emit('ai-response', { text: aiResponse });
                const audioBuffer = await this.elevenlabsService.textToSpeech(aiResponse);
                console.log(`[ElevenLabs] Audio buffer generated: ${audioBuffer.length} bytes`);
                client.emit('audio', audioBuffer);
            }, (error) => {
                console.error('[STT] Error:', error);
                client.emit('error', { message: 'Speech recognition error', details: error });
            });
            if (sttConnection.on) {
                sttConnection.on('open', () => {
                    console.log(`[STT] Connection opened for client: ${client.id}, flushing queued audio...`);
                    audioQueue.forEach((chunk) => sttService.sendAudio(sttConnection, chunk));
                    audioQueue.length = 0;
                });
            }
            console.log(`[WS] STT connection established for client: ${client.id}`);
            this.activeConnections.set(client.id, {
                sttConnection,
                sttService,
                conversationId,
                audioQueue,
            });
        }
        catch (err) {
            console.error(`[WS] Error during connection setup for client ${client.id}:`, err);
            client.emit('error', { message: 'Connection setup failed', details: err });
        }
    }
    handleDisconnect(client) {
        console.log(`[WS] Client disconnected: ${client.id}`);
        const connection = this.activeConnections.get(client.id);
        if (connection) {
            console.log(`[WS] Closing STT connection for client: ${client.id}`);
            connection.sttService.closeConnection(connection.sttConnection);
            console.log(`[Conversation] Ending conversation: ${connection.conversationId}`);
            this.conversationService.endConversation(connection.conversationId);
            this.activeConnections.delete(client.id);
            console.log(`[WS] Connection removed for client: ${client.id}`);
        }
    }
    handleAudioData(data, client) {
        const connection = this.activeConnections.get(client.id);
        const audioBuffer = Buffer.from(data);
        if (connection && connection.sttConnection) {
            const isReady = connection.sttConnection.getReadyState
                ? connection.sttConnection.getReadyState() === 1
                : connection.sttConnection.readyState === 1;
            if (isReady) {
                console.log(`[WS] Sending audio buffer of length: ${audioBuffer.length} for client: ${client.id}`);
                connection.sttService.sendAudio(connection.sttConnection, audioBuffer);
            }
            else {
                console.log(`[WS] STT not ready, queueing audio chunk of size: ${audioBuffer.length} for client: ${client.id}`);
                connection.audioQueue.push(audioBuffer);
            }
        }
        else {
            console.warn(`[WS] No active STT connection for client: ${client.id}`);
        }
    }
    handleStopSpeaking(client) {
        console.log(`[WS] Stop speaking requested by client: ${client.id}`);
        client.emit('stop-audio');
    }
};
exports.VoiceGateway = VoiceGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], VoiceGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('audio-data'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], VoiceGateway.prototype, "handleAudioData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stop-speaking'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], VoiceGateway.prototype, "handleStopSpeaking", null);
exports.VoiceGateway = VoiceGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [stt_factory_service_1.STTFactoryService,
        openai_service_1.OpenAIService,
        elevenlabs_service_1.ElevenLabsService,
        conversation_service_1.ConversationService])
], VoiceGateway);
//# sourceMappingURL=voice.gateway.js.map