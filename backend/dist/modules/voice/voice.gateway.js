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
const deepgram_service_1 = require("./deepgram.service");
const openai_service_1 = require("./openai.service");
const elevenlabs_service_1 = require("./elevenlabs.service");
const conversation_service_1 = require("../conversation/conversation.service");
let VoiceGateway = class VoiceGateway {
    constructor(deepgramService, openaiService, elevenlabsService, conversationService) {
        this.deepgramService = deepgramService;
        this.openaiService = openaiService;
        this.elevenlabsService = elevenlabsService;
        this.conversationService = conversationService;
        this.activeConnections = new Map();
    }
    async handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
        const conversationId = await this.conversationService.createConversation(client.id);
        const deepgramConnection = await this.deepgramService.createLiveTranscription(async (transcript) => {
            console.log('Transcript:', transcript);
            client.emit('transcript', { text: transcript });
            await this.conversationService.addMessage(conversationId, 'user', transcript);
            const messages = await this.conversationService.getConversationHistory(conversationId);
            const aiResponse = await this.openaiService.generateResponse(messages);
            console.log('AI Response:', aiResponse);
            await this.conversationService.addMessage(conversationId, 'assistant', aiResponse);
            client.emit('ai-response', { text: aiResponse });
            const audioBuffer = await this.elevenlabsService.textToSpeech(aiResponse);
            client.emit('audio', audioBuffer);
        }, (error) => {
            console.error('Deepgram error:', error);
            client.emit('error', { message: 'Speech recognition error' });
        });
        this.activeConnections.set(client.id, {
            deepgramConnection,
            conversationId,
        });
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        const connection = this.activeConnections.get(client.id);
        if (connection) {
            this.deepgramService.closeConnection(connection.deepgramConnection);
            this.conversationService.endConversation(connection.conversationId);
            this.activeConnections.delete(client.id);
        }
    }
    handleAudioData(data, client) {
        const connection = this.activeConnections.get(client.id);
        if (connection && connection.deepgramConnection) {
            const audioBuffer = Buffer.from(data);
            this.deepgramService.sendAudio(connection.deepgramConnection, audioBuffer);
        }
    }
    handleStopSpeaking(client) {
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
    __metadata("design:paramtypes", [deepgram_service_1.DeepgramService,
        openai_service_1.OpenAIService,
        elevenlabs_service_1.ElevenLabsService,
        conversation_service_1.ConversationService])
], VoiceGateway);
//# sourceMappingURL=voice.gateway.js.map