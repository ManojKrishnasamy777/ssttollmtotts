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
exports.OpenAIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
let OpenAIService = class OpenAIService {
    constructor(configService) {
        this.configService = configService;
        this.userConversations = {};
        this.firstMessageVariants = [
            (companyName) => `Hello! Welcome to ${companyName} Real Estate. I’m here to help you find the perfect property or answer any questions about buying, selling, or renting. Could you tell me a bit about what you are looking for today?`,
            (companyName) => `Hi there! Thanks for visiting ${companyName} Real Estate. I can help you with buying, selling, or renting properties. Can you share a little about what type of property or location you're interested in?`,
            (companyName) => `Greetings! You’ve reached ${companyName} Real Estate. I’d love to assist you in finding the right property. Could you tell me what kind of property and location you’re considering?`,
        ];
        const apiKey = this.configService.get('OPENAI_API_KEY');
        console.log('Initializing OpenAI client. API Key:', apiKey ? 'FOUND' : 'MISSING');
        this.openai = new openai_1.default({ apiKey });
    }
    getRandomFirstMessage(companyName) {
        const index = Math.floor(Math.random() * this.firstMessageVariants.length);
        return { role: 'assistant', content: this.firstMessageVariants[index](companyName) };
    }
    async generateResponse(userId, messages = [], clientType = 'buyer') {
        const companyName = this.configService.get('COMPANY_NAME') || 'Our Company';
        if (!this.userConversations[userId]) {
            const systemPrompt = {
                role: 'system',
                content: `

You are a professional real estate assistant. Your client is a ${clientType}.
Your job is to help clients with buying, selling, or renting properties.
Always respond politely, provide clear and concise information, and guide clients with relevant options.
Ask qualifying questions to understand client needs:

* Type of property (house, apartment, commercial)
* Budget range
* Preferred location
* Move-in timeline
  If you don't know an answer, suggest alternatives or offer to connect them with a human agent.
  `,
            };
            const firstMessage = this.getRandomFirstMessage(companyName);
            this.userConversations[userId] = [systemPrompt, firstMessage];
            if (!messages || messages.length === 0) {
                return firstMessage.content;
            }
        }
        if (messages.length > 0) {
            this.userConversations[userId].push(...messages);
        }
        console.log(`Sending conversation for user ${userId} to OpenAI:`, this.userConversations[userId]);
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: this.userConversations[userId],
                max_tokens: 400,
                temperature: 1.0,
            });
            const content = response.choices[0]?.message?.content;
            if (content) {
                this.userConversations[userId].push({ role: 'assistant', content });
                console.log(`OpenAI response for user ${userId}:`, content);
                return content;
            }
            else {
                console.warn(`OpenAI response did not contain content for user ${userId}`);
                return 'I apologize, I could not generate a response.';
            }
        }
        catch (error) {
            console.error(`OpenAI error for user ${userId}:`, error);
            throw error;
        }
    }
};
exports.OpenAIService = OpenAIService;
exports.OpenAIService = OpenAIService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAIService);
//# sourceMappingURL=openai.service.js.map