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
exports.SarvamService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sarvamai_1 = require("sarvamai");
let SarvamService = class SarvamService {
    constructor(configService) {
        this.configService = configService;
        this.DEFAULT_LANGUAGE_CODE = 'ta-IN';
        const apiKey = this.configService.get('SARVAM_API_KEY');
        console.log('--- DEBUG START ---');
        console.log(`[Sarvam Init] Initializing client with API key: ${apiKey ? 'FOUND' : 'MISSING'}`);
        this.sarvamClient = new sarvamai_1.SarvamAIClient({
            apiSubscriptionKey: apiKey,
        });
    }
    async createLiveTranscription(onTranscript, onError) {
        console.log('[Sarvam Connect] Creating live transcription connection...');
        console.log(`[Sarvam Connect] Config: Language=${this.DEFAULT_LANGUAGE_CODE}, Codec='pcm_s16le', SampleRate=16000`);
        try {
            const connection = await this.sarvamClient.speechToTextStreaming.connect({
                'language-code': this.DEFAULT_LANGUAGE_CODE,
                input_audio_codec: 'pcm_s16le',
                sample_rate: 16000,
            });
            console.log('[Sarvam Connect] **Connection established successfully.**');
            connection.on('message', (response) => {
                const responseAny = response;
                let transcript;
                console.log(`[Sarvam Event] RECEIVED MESSAGE: ${JSON.stringify(responseAny)}`);
                if (responseAny.type === 'error') {
                    console.error(`[Sarvam Event] Error in response: ${JSON.stringify(responseAny)}`);
                    return;
                }
                transcript = responseAny.transcript ||
                    responseAny.data?.transcript ||
                    responseAny.text ||
                    responseAny.data?.text ||
                    responseAny.results?.[0]?.transcript ||
                    responseAny.transcription;
                if (transcript && transcript.trim().length > 0) {
                    console.log(`[Sarvam Transcript] **TRANSCRIBED TEXT:** ${transcript}`);
                    onTranscript(transcript);
                }
                else if (responseAny.type !== 'partial') {
                    console.log('[Sarvam Event] Received message without transcript:', JSON.stringify(responseAny, null, 2));
                }
            });
            connection.on('error', (error) => {
                console.error(`[Sarvam Event] **ERROR EVENT:** ${JSON.stringify(error, null, 2)}`);
                onError(error);
            });
            connection.on('close', () => {
                console.log('[Sarvam Event] **CONNECTION CLOSED.**');
            });
            const sarvamConnectionWrapper = {
                connection,
                listener: null,
                send: async (audioData) => {
                    const state = connection.readyState ?? 0;
                    if (state === 1) {
                        try {
                            const audioBase64 = audioData.toString('base64');
                            await connection.transcribe({ audio: audioBase64 });
                        }
                        catch (error) {
                            console.error('[Sarvam Send] Error sending audio:', error);
                        }
                    }
                    else {
                        console.warn(`[Sarvam Send] WARNING: Connection not ready (state=${state})`);
                    }
                },
                finish: async () => {
                    console.log('[Sarvam Close] Closing connection...');
                    await connection.transcribe({ audio: '' });
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await connection.close();
                },
                getReadyState: () => connection.readyState ?? 0
            };
            return sarvamConnectionWrapper;
        }
        catch (error) {
            console.error(`[Sarvam Connect] **FATAL CONNECTION ERROR:** ${error}`);
            onError(error);
            return {
                connection: null,
                listener: null,
                send: async () => console.warn('[Sarvam Send] Connection failed, cannot send audio'),
                finish: async () => console.warn('[Sarvam Close] Connection failed, nothing to close'),
                getReadyState: () => 0
            };
        }
    }
    sendAudio(connection, audioData) {
        if (!connection) {
            console.warn('[Sarvam Send] No connection wrapper to send audio.');
            return;
        }
        const state = connection.getReadyState();
        connection.send(audioData);
    }
    closeConnection(connection) {
        if (connection) {
            connection.finish();
        }
        else {
            console.warn('[Sarvam Close] No connection wrapper to close.');
        }
    }
};
exports.SarvamService = SarvamService;
exports.SarvamService = SarvamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SarvamService);
//# sourceMappingURL=sarvam.service.js.map