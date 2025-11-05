"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SarvamService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SarvamService = class SarvamService {
    constructor(configService) {
        this.configService = configService;
        this.wsUrl = 'wss://api.sarvam.ai/speech-to-text-translate';
        this.apiKey = this.configService.get('SARVAM_API_KEY');
        console.log('Initializing Sarvam client with API key:', this.apiKey ? 'FOUND' : 'MISSING');
    }
    async createLiveTranscription(onTranscript, onError) {
        console.log('Creating Sarvam live transcription connection...');
        const WebSocket = (await Promise.resolve().then(() => __importStar(require('ws')))).default;
        const ws = new WebSocket(this.wsUrl, {
            headers: {
                'api-subscription-key': this.apiKey,
            },
        });
        ws.on('open', () => {
            console.log('Sarvam WebSocket connection opened');
            const config = {
                language_code: 'en-IN',
                model: 'saarika:v1',
                format: 'pcm',
                sample_rate: 16000,
            };
            ws.send(JSON.stringify(config));
        });
        ws.on('message', (data) => {
            try {
                const response = JSON.parse(data.toString());
                console.log('Received Sarvam message:', response);
                if (response.type === 'transcript' && response.text) {
                    const transcript = response.text.trim();
                    if (transcript.length > 0) {
                        console.log('Sarvam transcribed text:', transcript);
                        onTranscript(transcript);
                    }
                }
            }
            catch (error) {
                console.error('Error parsing Sarvam message:', error);
            }
        });
        ws.on('error', (error) => {
            console.error('Sarvam WebSocket error:', error);
            onError(error);
        });
        ws.on('close', () => {
            console.log('Sarvam WebSocket connection closed');
        });
        return ws;
    }
    sendAudio(connection, audioData) {
        if (!connection) {
            console.warn('No Sarvam connection to send audio');
            return;
        }
        if (connection.readyState === 1) {
            console.log('Sending audio buffer to Sarvam, length:', audioData.length);
            connection.send(audioData);
        }
        else {
            console.warn('Sarvam connection not open, cannot send audio');
        }
    }
    closeConnection(connection) {
        if (!connection) {
            console.warn('No Sarvam connection to close');
            return;
        }
        console.log('Closing Sarvam connection...');
        connection.close();
    }
};
exports.SarvamService = SarvamService;
exports.SarvamService = SarvamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SarvamService);
//# sourceMappingURL=sarvam.service.js.map