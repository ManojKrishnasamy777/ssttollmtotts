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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let ElevenLabsService = class ElevenLabsService {
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('ELEVENLABS_API_KEY');
        this.voiceId = this.configService.get('ELEVENLABS_VOICE_ID');
        console.log('Initializing ElevenLabsService. API Key:', this.apiKey ? 'FOUND' : 'MISSING', 'Voice ID:', this.voiceId || 'MISSING');
    }
    async textToSpeech(text) {
        console.log('Sending text to ElevenLabs TTS:', text);
        try {
            const response = await axios_1.default.post(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
                text,
                model_id: 'eleven_turbo_v2',
                voice_settings: {
                    stability: 0.35,
                    similarity_boost: 0.85,
                    style: 0.4,
                    use_speaker_boost: true,
                    stochasticity: 0.2
                },
            }, {
                headers: {
                    Accept: 'audio/mpeg',
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                responseType: 'arraybuffer',
            });
            console.log('ElevenLabs TTS request successful. Response size:', response.data.byteLength, 'bytes');
            return Buffer.from(response.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('ElevenLabs Axios error:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                });
            }
            else {
                console.error('ElevenLabs unknown error:', error);
            }
            throw error;
        }
    }
};
exports.ElevenLabsService = ElevenLabsService;
exports.ElevenLabsService = ElevenLabsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ElevenLabsService);
//# sourceMappingURL=elevenlabs.service.js.map