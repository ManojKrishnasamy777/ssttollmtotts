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
exports.STTFactoryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const deepgram_service_1 = require("./deepgram.service");
const sarvam_service_1 = require("./sarvam.service");
let STTFactoryService = class STTFactoryService {
    constructor(configService, deepgramService, sarvamService) {
        this.configService = configService;
        this.deepgramService = deepgramService;
        this.sarvamService = sarvamService;
    }
    getSTTService() {
        const provider = this.configService.get('STT_PROVIDER') || 'deepgram';
        console.log(`Using STT provider: ${provider}`);
        switch (provider.toLowerCase()) {
            case 'sarvam':
                return this.sarvamService;
            case 'deepgram':
            default:
                return this.deepgramService;
        }
    }
};
exports.STTFactoryService = STTFactoryService;
exports.STTFactoryService = STTFactoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        deepgram_service_1.DeepgramService,
        sarvam_service_1.SarvamService])
], STTFactoryService);
//# sourceMappingURL=stt-factory.service.js.map