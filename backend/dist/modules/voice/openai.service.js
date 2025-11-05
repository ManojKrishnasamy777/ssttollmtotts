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
            (companyName) => `Hey! Thanks for calling ${companyName}. How's your day going so far?`,
            (companyName) => `Hi there! You've reached ${companyName}. What can I help you with today?`,
            (companyName) => `Hello! This is ${companyName}. How can I assist you?`,
            (companyName) => `Hey, good to hear from you! This is ${companyName}. What brings you in today?`,
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
                content: `You are a friendly, conversational real estate assistant speaking naturally like a real human. Your client is a ${clientType}.

IMPORTANT CONVERSATION GUIDELINES:
- Speak naturally and conversationally, like you're having a phone call with a friend
- Use casual language, contractions ("I'm", "you're", "that's"), and filler words occasionally ("um", "you know", "I mean")
- Keep responses SHORT - aim for 1-2 sentences per response in most cases
- Don't sound robotic or overly formal
- Show personality and empathy - react to what they say
- Ask follow-up questions naturally, one at a time
- Don't list multiple questions at once
- Use "yeah", "sure", "absolutely", "got it" to acknowledge
- Pause and listen - don't rush or over-explain

Your goal is to help with buying, selling, or renting properties by understanding:
- What type of property they're interested in
- Their budget range
- Preferred location
- Timeline

But gather this information naturally through conversation, not like a checklist. If you don't know something, just say so and offer to connect them with someone who can help.`,
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
                max_tokens: 150,
                temperature: 0.9,
                presence_penalty: 0.6,
                frequency_penalty: 0.3,
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