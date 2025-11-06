import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private userConversations: Record<string, Array<{ role: string; content: string }>> = {};

  private firstMessageVariants = [
    (companyName: string) => `Hi! This is Shreya calling from ${companyName}. How are you doing today?`,
    (companyName: string) => `Good morning! I’m Shreya from ${companyName}. Hope your day’s going well.`,
    (companyName: string) => `Hello! This is Shreya from ${companyName}. I wanted to tell you about our Diwali offers.`,
    (companyName: string) => `Hey there! You’re speaking with Shreya from ${companyName}. Do you have a minute to talk about our new offers?`,
  ];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    console.log('Initializing OpenAI client. API Key:', apiKey ? 'FOUND' : 'MISSING');
    this.openai = new OpenAI({ apiKey });
  }

  private getRandomFirstMessage(companyName: string) {
    const index = Math.floor(Math.random() * this.firstMessageVariants.length);
    return { role: 'assistant', content: this.firstMessageVariants[index](companyName) };
  }

  private detectComplexity(messages: Array<{ role: string; content: string }>): boolean {
    const joined = messages.map(m => m.content).join(' ').toLowerCase();
    return joined.length > 400 || /(explain|calculate|reason|technical|analyze)/i.test(joined);
  }

  async generateResponse(
    userId: string,
    messages: Array<{ role: string; content: string }> = [],
    clientType: 'buyer' | 'seller' | 'renter' = 'buyer',
  ): Promise<string> {
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
      if (!messages || messages.length === 0) return firstMessage.content;
    }

    if (messages.length > 0) {
      this.userConversations[userId].push(...messages);
    }

    // Limit conversation history
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
        messages: this.userConversations[userId] as any,
        max_tokens: isComplex ? 1000 : 400,
        temperature: isComplex ? 1.0 : 0.8,
        top_p: 0.9,
        presence_penalty: 0.7,
        frequency_penalty: 0.4,
        user: userId,
        stream: true, // ✅ Enable streaming mode
      });

      // 🌀 Stream response chunks in real-time
      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          // Optional: forward partial text to your voice TTS system here
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
    } catch (error) {
      console.error(`❌ OpenAI stream error for ${userId}:`, error);
      throw error;
    }
  }
}
