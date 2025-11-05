import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async generateResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages as any,
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
    } catch (error) {
      console.error('OpenAI error:', error);
      throw error;
    }
  }
}
