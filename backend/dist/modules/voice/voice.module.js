"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceModule = void 0;
const common_1 = require("@nestjs/common");
const stream_controller_1 = require("./stream.controller");
const stream_service_1 = require("./stream.service");
const deepgram_service_1 = require("./deepgram.service");
const sarvam_service_1 = require("./sarvam.service");
const stt_factory_service_1 = require("./stt-factory.service");
const openai_service_1 = require("./openai.service");
const elevenlabs_service_1 = require("./elevenlabs.service");
const conversation_module_1 = require("../conversation/conversation.module");
let VoiceModule = class VoiceModule {
};
exports.VoiceModule = VoiceModule;
exports.VoiceModule = VoiceModule = __decorate([
    (0, common_1.Module)({
        imports: [conversation_module_1.ConversationModule],
        controllers: [stream_controller_1.StreamController],
        providers: [
            stream_service_1.StreamService,
            deepgram_service_1.DeepgramService,
            sarvam_service_1.SarvamService,
            stt_factory_service_1.STTFactoryService,
            openai_service_1.OpenAIService,
            elevenlabs_service_1.ElevenLabsService,
        ],
    })
], VoiceModule);
//# sourceMappingURL=voice.module.js.map