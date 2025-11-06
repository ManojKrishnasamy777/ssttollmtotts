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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamService = void 0;
const common_1 = require("@nestjs/common");
const stt_factory_service_1 = require("./stt-factory.service");
const openai_service_1 = require("./openai.service");
const elevenlabs_service_1 = require("./elevenlabs.service");
const conversation_service_1 = require("../conversation/conversation.service");
let StreamService = class StreamService {
    constructor(sttFactory, openaiService, elevenlabsService, conversationService) {
        this.sttFactory = sttFactory;
        this.openaiService = openaiService;
        this.elevenlabsService = elevenlabsService;
        this.conversationService = conversationService;
        this.connections = new Map();
        this.VAD_THRESHOLD = 0.02;
        this.startCleanupTask();
    }
    async registerClient(userId, eventCallback) {
        console.log(`[Stream] Registering client: ${userId}`);
        const conversationId = await this.conversationService.createConversation(userId);
        console.log(`[Stream] Created conversation: ${conversationId}`);
        const sttService = this.sttFactory.getSTTService();
        const sttConnection = await sttService.createLiveTranscription(async (transcript) => {
            console.log(`[STT] Transcript: "${transcript}"`);
            const conn = this.connections.get(userId);
            if (!conn)
                return;
            eventCallback({
                type: 'transcript',
                text: transcript,
            });
            if (conn.isAISpeaking) {
                console.log('[Interrupt] User interrupted AI, queuing transcript');
                conn.pendingTranscripts.push(transcript);
                if (conn.interruptTimeout) {
                    clearTimeout(conn.interruptTimeout);
                }
                conn.interruptTimeout = setTimeout(async () => {
                    await this.handleInterrupt(userId);
                }, 1500);
                eventCallback({
                    type: 'ai-interrupted',
                });
                return;
            }
            await this.processTranscript(userId, transcript);
        }, (error) => {
            console.error('[STT] Error:', error);
            eventCallback({
                type: 'error',
                error: error.message,
            });
        });
        const connection = {
            conversationId,
            sttConnection,
            audioQueue: [],
            lastActivityTime: Date.now(),
            eventCallback,
            firstMessageSent: false,
            isAISpeaking: false,
            pendingTranscripts: [],
        };
        this.connections.set(userId, connection);
        setTimeout(async () => {
            const conn = this.connections.get(userId);
            if (!conn || conn.firstMessageSent)
                return;
            const messages = await this.conversationService.getConversationHistory(conversationId);
            const greeting = await this.openaiService.generateResponse(userId, messages);
            console.log(`[AI] Initial greeting: "${greeting}"`);
            await this.conversationService.addMessage(conversationId, 'assistant', greeting);
            eventCallback({
                type: 'ai-response',
                text: greeting,
            });
            conn.isAISpeaking = true;
            const audioBuffer = await this.elevenlabsService.textToSpeech(greeting);
            eventCallback({
                type: 'audio',
                data: audioBuffer.toString('base64'),
            });
            conn.firstMessageSent = true;
            setTimeout(() => {
                const c = this.connections.get(userId);
                if (c) {
                    c.isAISpeaking = false;
                }
            }, Math.floor(audioBuffer.length / 32));
        }, 500);
    }
    async processTranscript(userId, transcript) {
        const connection = this.connections.get(userId);
        if (!connection)
            return;
        const { conversationId, eventCallback } = connection;
        await this.conversationService.addMessage(conversationId, 'user', transcript);
        const messages = await this.conversationService.getConversationHistory(conversationId);
        const aiResponse = await this.openaiService.generateResponse(userId, messages);
        console.log(`[AI] Response: "${aiResponse}"`);
        await this.conversationService.addMessage(conversationId, 'assistant', aiResponse);
        eventCallback({
            type: 'ai-response',
            text: aiResponse,
        });
        connection.isAISpeaking = true;
        const audioBuffer = await this.elevenlabsService.textToSpeech(aiResponse);
        console.log(`[TTS] Generated audio: ${audioBuffer.length} bytes`);
        eventCallback({
            type: 'audio',
            data: audioBuffer.toString('base64'),
        });
        setTimeout(() => {
            const conn = this.connections.get(userId);
            if (conn) {
                conn.isAISpeaking = false;
            }
        }, Math.floor(audioBuffer.length / 32));
    }
    async handleInterrupt(userId) {
        const connection = this.connections.get(userId);
        if (!connection)
            return;
        console.log('[Interrupt] Processing user interruption');
        connection.isAISpeaking = false;
        if (connection.pendingTranscripts.length === 0)
            return;
        const combinedTranscript = connection.pendingTranscripts.join(' ');
        connection.pendingTranscripts = [];
        console.log(`[Interrupt] Processing combined transcript: "${combinedTranscript}"`);
        await this.processTranscript(userId, combinedTranscript);
    }
    async processAudio(userId, audioData) {
        const connection = this.connections.get(userId);
        if (!connection) {
            console.warn(`[Stream] No connection found for user: ${userId}`);
            return;
        }
        connection.lastActivityTime = Date.now();
        const rms = this.calculateRMS(audioData);
        if (rms > this.VAD_THRESHOLD) {
            console.log(`[VAD] Voice detected (RMS: ${rms.toFixed(4)})`);
            const sttService = this.sttFactory.getSTTService();
            if (connection.sttConnection) {
                sttService.sendAudio(connection.sttConnection, audioData);
            }
        }
    }
    calculateRMS(buffer) {
        let sum = 0;
        const samples = buffer.length / 2;
        for (let i = 0; i < buffer.length; i += 2) {
            const sample = buffer.readInt16LE(i) / 32768.0;
            sum += sample * sample;
        }
        return Math.sqrt(sum / samples);
    }
    async unregisterClient(userId) {
        const connection = this.connections.get(userId);
        if (!connection) {
            return;
        }
        console.log(`[Stream] Unregistering client: ${userId}`);
        const sttService = this.sttFactory.getSTTService();
        sttService.closeConnection(connection.sttConnection);
        await this.conversationService.endConversation(connection.conversationId);
        this.connections.delete(userId);
    }
    async endCall(userId) {
        await this.unregisterClient(userId);
    }
    startCleanupTask() {
        setInterval(() => {
            const now = Date.now();
            const timeout = 5 * 60 * 1000;
            for (const [userId, connection] of this.connections.entries()) {
                if (now - connection.lastActivityTime > timeout) {
                    console.log(`[Stream] Cleaning up inactive connection: ${userId}`);
                    this.unregisterClient(userId);
                }
            }
        }, 60000);
    }
};
exports.StreamService = StreamService;
exports.StreamService = StreamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stt_factory_service_1.STTFactoryService,
        openai_service_1.OpenAIService,
        elevenlabs_service_1.ElevenLabsService,
        conversation_service_1.ConversationService])
], StreamService);
//# sourceMappingURL=stream.service.js.map