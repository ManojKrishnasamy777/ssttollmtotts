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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const conversation_entity_1 = require("../../database/entities/conversation.entity");
const message_entity_1 = require("../../database/entities/message.entity");
let ConversationService = class ConversationService {
    constructor(conversationRepository, messageRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }
    async createConversation(userId) {
        const conversation = this.conversationRepository.create({ userId });
        const saved = await this.conversationRepository.save(conversation);
        return saved.id;
    }
    async addMessage(conversationId, role, content) {
        const message = this.messageRepository.create({
            conversationId,
            role,
            content,
        });
        await this.messageRepository.save(message);
    }
    async getConversationHistory(conversationId) {
        const messages = await this.messageRepository.find({
            where: { conversationId },
            order: { createdAt: 'ASC' },
        });
        return [
            { role: 'system', content: 'You are a helpful AI voice assistant. Keep your responses concise and conversational.' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
        ];
    }
    async endConversation(conversationId) {
        await this.conversationRepository.update(conversationId, {
            endedAt: new Date(),
        });
    }
};
exports.ConversationService = ConversationService;
exports.ConversationService = ConversationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ConversationService);
//# sourceMappingURL=conversation.service.js.map