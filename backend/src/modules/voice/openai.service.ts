import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    console.log('Initializing OpenAI client. API Key:', apiKey ? 'FOUND' : 'MISSING');

    this.openai = new OpenAI({ apiKey });

  }

  /**
  
  * Generates a response from OpenAI GPT based on user messages,
  * automatically prepending a real estate system prompt and first assistant message.
  *
  * @param messages - Array of user messages [{role: 'user', content: string}]
  * @param clientType - Optional: 'buyer', 'seller', 'renter' (default: 'buyer')
    */
  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    clientType: 'buyer' | 'seller' | 'renter' = 'buyer',
  ): Promise<string> {
    const companyName = this.configService.get('COMPANY_NAME') || 'Our Company';

    // Pre-call system prompt for real estate context

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

    // Pre-call first assistant message
    const firstMessage = {
      role: 'assistant',
      content: `Hello! Welcome to ${companyName} Real Estate. 
  I’m here to help you find the perfect property or answer any questions about buying, selling, or renting. 
  Could you tell me a bit about what you are looking for today? For example, the type of property, location, and your budget.`,
    };

    // Combine system prompt, first message, and user messages
    const fullMessages = [systemPrompt, firstMessage, ...messages];

    console.log('Sending messages to OpenAI:', fullMessages);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: fullMessages as any,
        max_tokens: 400, // increased token limit for detailed responses
        temperature: 0.7,
      });

      console.log('OpenAI response object:', JSON.stringify(response, null, 2));

      const content = response.choices[0]?.message?.content;
      if (content) {
        console.log('OpenAI generated content:', content);
        return content;
      } else {
        console.warn('OpenAI response did not contain content');
        return 'I apologize, I could not generate a response.';
      }

    } catch (error) {
      console.error('OpenAI error occurred:', error);
      throw error;
    }
  }
}
