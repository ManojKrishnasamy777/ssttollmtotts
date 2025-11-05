import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  // Store conversation history per user (keyed by userId)
  private userConversations: Record<string, Array<{ role: string; content: string }>> = {};

  private firstMessageVariants = [
    (companyName: string) => `Hello! Welcome to ${companyName} Real Estate. I’m here to help you find the perfect property or answer any questions about buying, selling, or renting. Could you tell me a bit about what you are looking for today?`,
    (companyName: string) => `Hi there! Thanks for visiting ${companyName} Real Estate. I can help you with buying, selling, or renting properties. Can you share a little about what type of property or location you're interested in?`,
    (companyName: string) => `Greetings! You’ve reached ${companyName} Real Estate. I’d love to assist you in finding the right property. Could you tell me what kind of property and location you’re considering?`,
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

  async generateResponse(
    userId: string,
    messages: Array<{ role: string; content: string }> = [],
    clientType: 'buyer' | 'seller' | 'renter' = 'buyer',
  ): Promise<string> {
    const companyName = this.configService.get('COMPANY_NAME') || 'Our Company';

    // Initialize conversation for this user if not exists
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

      // If no user messages, return the first message
      if (!messages || messages.length === 0) {
        return firstMessage.content;
      }

    }

    // Add user messages to their conversation
    if (messages.length > 0) {
      this.userConversations[userId].push(...messages);
    }

    console.log(`Sending conversation for user ${userId} to OpenAI:`, this.userConversations[userId]);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: this.userConversations[userId] as any,
        max_tokens: 400,
        temperature: 1.0,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        this.userConversations[userId].push({ role: 'assistant', content });
        console.log(`OpenAI response for user ${userId}:`, content);
        return content;
      } else {
        console.warn(`OpenAI response did not contain content for user ${userId}`);
        return 'I apologize, I could not generate a response.';
      }

    } catch (error) {
      console.error(`OpenAI error for user ${userId}:`, error);
      throw error;
    }
  }
}
