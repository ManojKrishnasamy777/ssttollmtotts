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
exports.DeepgramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = require("@deepgram/sdk");
let DeepgramService = class DeepgramService {
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('DEEPGRAM_API_KEY');
        console.log('Initializing Deepgram client with API key:', apiKey ? 'FOUND' : 'MISSING');
        this.deepgram = (0, sdk_1.createClient)(apiKey);
    }
    async createLiveTranscription(onTranscript, onError) {
        console.log('Creating live transcription connection...');
        const connection = this.deepgram.listen.live({
            model: 'nova-2',
            language: 'en-US',
            encoding: 'linear16',
            sample_rate: 16000,
            smart_format: true,
            interim_results: false,
        });
        let keepAliveInterval = null;
        connection.on(sdk_1.LiveTranscriptionEvents.Open, () => {
            console.log('Deepgram connection opened');
            keepAliveInterval = setInterval(() => {
                if (connection && connection.getReadyState() === 1) {
                    const silence = Buffer.alloc(3200);
                    connection.send(silence);
                }
            }, 1000);
        });
        connection.on(sdk_1.LiveTranscriptionEvents.Transcript, (data) => {
            console.log('Received transcript event:', JSON.stringify(data));
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            if (transcript && transcript.trim().length > 0) {
                console.log('Transcribed text:', transcript);
                onTranscript(transcript);
            }
            else {
                console.log('Transcript empty or undefined');
            }
        });
        connection.on(sdk_1.LiveTranscriptionEvents.Error, (error) => {
            console.error('Deepgram error event:', JSON.stringify(error, null, 2));
            onError(error);
        });
        connection.on(sdk_1.LiveTranscriptionEvents.Close, () => {
            console.log('Deepgram connection closed');
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
                keepAliveInterval = null;
            }
        });
        return connection;
    }
    sendAudio(connection, audioData) {
        if (!connection) {
            console.warn('No connection to send audio');
            return;
        }
        const state = connection.getReadyState();
        console.log('Connection ready state:', state);
        if (state === 1) {
            console.log('Sending audio buffer of length:', audioData.length);
            connection.send(audioData);
        }
        else {
            console.warn('Connection not open, cannot send audio');
        }
    }
    closeConnection(connection) {
        if (!connection) {
            console.warn('No connection to close');
            return;
        }
        console.log('Closing Deepgram connection...');
        connection.finish();
    }
};
exports.DeepgramService = DeepgramService;
exports.DeepgramService = DeepgramService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DeepgramService);
//# sourceMappingURL=deepgram.service.js.map