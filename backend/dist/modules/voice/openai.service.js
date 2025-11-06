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
            (companyName) => `Hi! This is Shreya calling from ${companyName}. How are you doing today?`,
            (companyName) => `Good morning! I’m Shreya from ${companyName}. Hope your day’s going well.`,
            (companyName) => `Hello! This is Shreya from ${companyName}. I wanted to tell you about our Diwali offers.`,
            (companyName) => `Hey there! You’re speaking with Shreya from ${companyName}. Do you have a minute to talk about our new offers?`,
        ];
        const apiKey = this.configService.get('OPENAI_API_KEY');
        console.log('Initializing OpenAI client. API Key:', apiKey ? 'FOUND' : 'MISSING');
        this.openai = new openai_1.default({ apiKey });
    }
    getRandomFirstMessage(companyName) {
        const index = Math.floor(Math.random() * this.firstMessageVariants.length);
        return { role: 'assistant', content: this.firstMessageVariants[index](companyName) };
    }
    detectComplexity(messages) {
        const joined = messages.map(m => m.content).join(' ').toLowerCase();
        return joined.length > 400 || /(explain|calculate|reason|technical|analyze)/i.test(joined);
    }
    async generateResponse(userId, messages = [], clientType = 'buyer') {
        const companyName = this.configService.get('COMPANY_NAME') || 'Chennai Mobiles';
        if (!this.userConversations[userId]) {
            const systemPrompt = {
                role: 'system',
                content: `
You are Shreya — a 24-year-old Indian woman who works at The Chennai Mobiles.
You speak fluent Indian English — clear, natural, and expressive — like someone from Chennai or Bangalore.
Your tone is warm, friendly, confident, and genuine.
You help customers learn about the latest Diwali offers on smartphones, home appliances, and furniture.

🎯 Goal:
Engage the customer, make them curious, and guide them naturally toward visiting the Chennai Mobiles store at Avadi.
        `,
            };
            const firstMessage = this.getRandomFirstMessage(companyName);
            this.userConversations[userId] = [systemPrompt, firstMessage];
            if (!messages || messages.length === 0)
                return firstMessage.content;
        }
        if (messages.length > 0) {
            this.userConversations[userId].push(...messages);
        }
        if (this.userConversations[userId].length > 30) {
            this.userConversations[userId] = [
                this.userConversations[userId][0],
                ...this.userConversations[userId].slice(-20),
            ];
        }
        const isComplex = this.detectComplexity(messages);
        const selectedModel = isComplex ? 'gpt-4.1' : 'gpt-4.1-mini';
        try {
            const stream = await this.openai.chat.completions.create({
                model: selectedModel,
                messages: this.userConversations[userId],
                max_tokens: isComplex ? 1000 : 400,
                temperature: isComplex ? 1.0 : 0.8,
                top_p: 0.9,
                presence_penalty: 0.7,
                frequency_penalty: 0.4,
                user: userId,
                stream: true,
            });
            let fullResponse = '';
            for await (const chunk of stream) {
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                    fullResponse += content;
                    this.userConversations[userId].push({ role: 'assistant', content });
                    console.log('🗣️ Partial:', content);
                }
            }
            if (fullResponse) {
                this.userConversations[userId].push({ role: 'assistant', content: fullResponse });
                console.log(`✅ Shreya’s (${selectedModel}) full reply for ${userId}:`, fullResponse);
                return fullResponse;
            }
            console.warn(`⚠️ No content returned for user ${userId}`);
            return 'Sorry, I didn’t quite catch that. Could you please repeat?';
        }
        catch (error) {
            console.error(`❌ OpenAI stream error for ${userId}:`, error);
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