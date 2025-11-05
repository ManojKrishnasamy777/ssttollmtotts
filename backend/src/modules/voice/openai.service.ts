import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  // Store conversation history per user (keyed by userId)
  private userConversations: Record<string, Array<{ role: string; content: string }>> = {};

  private firstMessageVariants = [
    (companyName: string) => `Hey! Thanks for calling ${companyName}. How's your day going so far?`,
    (companyName: string) => `Hi there! You've reached ${companyName}. What can I help you with today?`,
    (companyName: string) => `Hello! This is ${companyName}. How can I assist you?`,
    (companyName: string) => `Hey, good to hear from you! This is ${companyName}. What brings you in today?`,
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
