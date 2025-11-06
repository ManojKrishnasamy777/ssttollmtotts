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
exports.SarvamService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ws_1 = __importDefault(require("ws"));
let SarvamService = class SarvamService {
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('SARVAM_API_KEY');
        this.endpoint = this.configService.get('SARVAM_STREAM_URL')
            || 'wss://streaming.sarvam.ai/speech-to-text/stream';
        if (!this.apiKey) {
            console.warn('Sarvam API key missing');
        }
    }
    async createLiveTranscription(onTranscript, onError) {
        console.log('Connecting to Sarvam streaming endpoint…');
        const connection = new ws_1.default(this.endpoint, {
            headers: { "api-subscription-key": this.apiKey }
        });
        let keepAliveInterval = null;
        connection.on('open', () => {
            console.log('Sarvam WebSocket connection opened');
            const configMsg = {
                config: {
                    model: 'saarika:v1',
                    language_code: 'en-IN',
                    sample_rate: 16000,
                    encoding: 'LINEAR16'
                }
            };
            console.log('Sending Sarvam config:', JSON.stringify(configMsg));
            connection.send(JSON.stringify(configMsg));
            keepAliveInterval = setInterval(() => {
                if (connection && connection.readyState === ws_1.default.OPEN) {
                    const silence = Buffer.alloc(3200);
                    connection.send(silence);
                }
            }, 5000);
        });
        connection.on('message', (msgRaw) => {
            try {
                const msgStr = msgRaw.toString();
                console.log('Sarvam raw message:', msgStr);
                const msg = JSON.parse(msgStr);
                console.log('Sarvam parsed message:', JSON.stringify(msg));
                if (msg.type === 'transcript' || msg.transcript) {
                    const text = (msg.transcript || msg.text || msg.data?.text || '').trim();
                    if (text.length > 0) {
                        console.log('Sarvam transcribed text:', text);
                        onTranscript(text);
                    }
                }
                else if (msg.type === 'final' && msg.text) {
                    const text = msg.text.trim();
                    if (text.length > 0) {
                        console.log('Sarvam final transcript:', text);
                        onTranscript(text);
                    }
                }
                else if (msg.is_final && msg.transcript) {
                    const text = msg.transcript.trim();
                    if (text.length > 0) {
                        console.log('Sarvam final transcript (is_final):', text);
                        onTranscript(text);
                    }
                }
            }
            catch (err) {
                console.error('Error parsing Sarvam message:', err);
                console.error('Raw message was:', msgRaw.toString());
            }
        });
        connection.on('error', (err) => {
            console.error('Sarvam WebSocket error:', err);
            onError(err);
        });
        connection.on('close', (code, reason) => {
            console.log(`Sarvam connection closed ${code} ${reason}`);
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
                keepAliveInterval = null;
            }
        });
        return connection;
    }
    sendAudio(connection, audioData) {
        if (!connection || connection.readyState !== ws_1.default.OPEN) {
            console.warn('Sarvam connection not open');
            return;
        }
        console.log('Sending audio buffer length:', audioData.length);
        connection.send(audioData);
    }
    closeConnection(connection) {
        if (!connection) {
            return;
        }
        console.log('Closing Sarvam connection');
        connection.close();
    }
};
exports.SarvamService = SarvamService;
exports.SarvamService = SarvamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SarvamService);
//# sourceMappingURL=sarvam.service.js.map