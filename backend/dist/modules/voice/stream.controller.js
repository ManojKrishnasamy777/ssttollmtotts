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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamController = void 0;
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const rxjs_1 = require("rxjs");
const stream_service_1 = require("./stream.service");
const sarvam_service_1 = require("./sarvam.service");
let StreamController = class StreamController {
    constructor(streamService, _SarvamService) {
        this.streamService = streamService;
        this._SarvamService = _SarvamService;
    }
    async handleAudioStream(payload, res) {
        try {
            const audioBuffer = Buffer.from(payload.audioData, 'base64');
            await this.streamService.processAudio(payload.userId, audioBuffer);
            return res.status(common_1.HttpStatus.OK).json({ success: true });
        }
        catch (error) {
            console.error('[Stream] Error handling audio:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to process audio',
            });
        }
    }
    streamEvents(userId, res) {
        console.log(`[SSE] Client connected: ${userId}`);
        const subject = new rxjs_1.Subject();
        this.streamService.registerClient(userId, (event) => {
            subject.next({ data: JSON.stringify(event) });
        });
        const cleanup = () => {
            console.log(`[SSE] Client disconnected: ${userId}`);
            this.streamService.unregisterClient(userId);
            subject.complete();
        };
        subject.subscribe({ complete: cleanup });
        const interval = setInterval(() => {
            subject.next({ data: JSON.stringify({ type: 'ping', time: Date.now() }) });
        }, 15000);
        subject.subscribe({
            complete: () => clearInterval(interval),
        });
        return subject.asObservable();
    }
    async handleEndCall(payload, res) {
        try {
            console.log(`[Stream] Ending call for user: ${payload.userId}`);
            await this.streamService.endCall(payload.userId);
            return res.status(common_1.HttpStatus.OK).json({ success: true });
        }
        catch (error) {
            console.error('[Stream] Error ending call:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to end call',
            });
        }
    }
};
exports.StreamController = StreamController;
__decorate([
    (0, common_1.Post)('audio'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "handleAudioStream", null);
__decorate([
    (0, common_1.Sse)('events/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _b : Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], StreamController.prototype, "streamEvents", null);
__decorate([
    (0, common_1.Post)('end-call'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_c = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "handleEndCall", null);
exports.StreamController = StreamController = __decorate([
    (0, common_1.Controller)({ path: 'stream', version: '1' }),
    __metadata("design:paramtypes", [stream_service_1.StreamService, sarvam_service_1.SarvamService])
], StreamController);
//# sourceMappingURL=stream.controller.js.map