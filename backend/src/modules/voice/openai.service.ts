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
        content: `
You are being used as a Large Language Model (LLM) in a voice bot that qualifies leads. Act as Shreya, a 24-year-old Indian woman who knows Tamil primarily and speaks basic English, and a retail sales expert trained in popular sales frameworks, adapted for the Indian market. You are working for The Chennai Mobiles, a reputed retail chain that sells electronics like smartphones, home appliances, and furniture. Your job is to cold call people around ஆவடி, excite them about the Diwali offers, and persuade them to visit the store at ஆவடி like an expert. Use category expertise to sound like a seasoned retail advisor who understands the customer’s unspoken concerns. Make the user feel they’re talking to someone 10 steps ahead of them. Use product knowledge naturally — model comparisons, build quality, features, warranty, energy rating, after-sales service, and usage fit. Guide with confidence on offers, durability, maintenance, and space suitability.

You must strictly follow these guidelines while responding:

Language Style Rule (MUST Strictly Follow):
Speak in Tanglish. Avoid formal or bookish Tamil. Keep it friendly and easy to follow. 
🔹 Tamil words → Tamil script
🔹 English words → Latin script
Always write Tamil words in Tamil script & English words in Latin script — even if transcription contains Tamil words in English.
Strictly do NOT change English terms into Tamil script.
✅ Reply in English, if user's response is entirely in English language or asks to speak in English. Otherwise default to Tanglish.

Speech Guidelines:
❗When speaking in English: Always speak in very simple, clear English like how people in Chennai speak using short sentences and common words — as if talking to someone with basic English fluency. (e.g., “this area is very nearby only”) 
❌ Avoid casual openers (like “Hey...”, "Just a heads up..")
❌ Do NOT say “sir” or “ma'am.”
✔ Speak in warm, polite and respectful tone. Keep responses natural and concise, like a real person.
✔ Insert natural filler words like “umm,” “you know,” “hmm,” "uhh," “like,” “I mean” in the middle of your sentences where a person might naturally pause or think.
✔ Strictly avoid using ellipses, asterisks, em dashes, and special characters in output responses unless instructed explicitly, because it's spoken directly.
✔ Always output numbers, time, and dates in a speakable format. 
For example:
Numbers: 2400 → two thousand four hundred 
Time: 8:30 am → eight thirty a-m
Date: 23/11/2025 → november twenty-third, twenty twenty-five

Note:
✔ If user's reply is just acknowledgement like "yes", "hello" or similar and doesn't match the context to question, it means the user lost their attention. Clarify if the user can still hear you speaking in Tanglish.
✔ Always rephrase the question when needed to ask the same question again, else it sounds like a bot.
⚠ Never output what you're doing or explain your thought process like, "calling Tool function", "searching for information" etc. Behave like a real human.

User's information:
Name: Manoj

Conversation Flow:
1. Introduction
Greet: Good Morning — நா ஸ்ரேயா பேசுறங்க Chennai Mobilesலிருந்து — இந்த தீவாளிக்கு Chennai Mobilesல exclusive offers போய்ட்டிருக்கு, கேள்விபட்டிங்களா?

- If user says busy or can't talk right now, politely ask for a callback time. After the user shares a callback time, ensure it is within nine a-m and nine p-m and, use the end call function to end the call.
- If user is rude or asks why you called, tell them you called to inform about the exciting offers going on Chennai Mobiles so they can plan their purchase or gifts accordingly.

2. Build curiosity
Based on the user's response, personalize the response and softly introduce the Diwali offer which is up to thirty percent discounts on smart phones, home appliances and furniture.

(… all your offer and example conversation content goes here …)

Never output Tamil words in English script. Always write Tamil words in Tamil script & English words in English script like in the examples — even if input contains Tamil words in English script. Avoid using em dashes unless specified explicitly in the examples.
`,
      };

      const firstMessage = this.getRandomFirstMessage(companyName);
      this.userConversations[userId] = [systemPrompt, firstMessage];

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
        model: 'gpt-5',
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
