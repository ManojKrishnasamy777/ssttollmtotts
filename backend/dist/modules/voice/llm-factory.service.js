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
exports.LLMFactoryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_service_1 = require("./openai.service");
const gemini_service_1 = require("./gemini.service");
let LLMFactoryService = class LLMFactoryService {
    constructor(configService, openaiService, geminiService) {
        this.configService = configService;
        this.openaiService = openaiService;
        this.geminiService = geminiService;
    }
    getLLMService() {
        const provider = this.configService.get('LLM_PROVIDER') || 'openai';
        console.log(`Using LLM provider: ${provider}`);
        switch (provider.toLowerCase()) {
            case 'gemini':
                return this.geminiService;
            case 'openai':
            default:
                return this.openaiService;
        }
    }
};
exports.LLMFactoryService = LLMFactoryService;
exports.LLMFactoryService = LLMFactoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        openai_service_1.OpenAIService,
        gemini_service_1.GeminiService])
], LLMFactoryService);
//# sourceMappingURL=llm-factory.service.js.map