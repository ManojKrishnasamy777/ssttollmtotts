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
        this.deepgram = (0, sdk_1.createClient)(this.configService.get('DEEPGRAM_API_KEY'));
    }
    async createLiveTranscription(onTranscript, onError) {
        const connection = this.deepgram.listen.live({
            model: 'nova-2',
            language: 'en-US',
            smart_format: true,
            interim_results: false,
        });
        connection.on(sdk_1.LiveTranscriptionEvents.Open, () => {
            console.log('Deepgram connection opened');
        });
        connection.on(sdk_1.LiveTranscriptionEvents.Transcript, (data) => {
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            if (transcript && transcript.trim().length > 0) {
                onTranscript(transcript);
            }
        });
        connection.on(sdk_1.LiveTranscriptionEvents.Error, (error) => {
            console.error('Deepgram error:', error);
            onError(error);
        });
        connection.on(sdk_1.LiveTranscriptionEvents.Close, () => {
            console.log('Deepgram connection closed');
        });
        return connection;
    }
    sendAudio(connection, audioData) {
        if (connection && connection.getReadyState() === 1) {
            connection.send(audioData);
        }
    }
    closeConnection(connection) {
        if (connection) {
            connection.finish();
        }
    }
};
exports.DeepgramService = DeepgramService;
exports.DeepgramService = DeepgramService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DeepgramService);
//# sourceMappingURL=deepgram.service.js.map