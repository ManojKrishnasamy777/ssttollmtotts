import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createConversation(userId: string): Promise<string> {
    const conversation = this.conversationRepository.create({ userId });
    const saved = await this.conversationRepository.save(conversation);
    return saved.id;
  }

  async addMessage(conversationId: string, role: string, content: string): Promise<void> {
    const message = this.messageRepository.create({
      conversationId,
      role,
      content,
    });
    await this.messageRepository.save(message);
  }

  async getConversationHistory(conversationId: string): Promise<Array<{ role: string; content: string }>> {
    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    return [
      { role: 'system', content: 'You are a helpful AI voice assistant. Keep your responses concise and conversational.' },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];
  }

  async endConversation(conversationId: string): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      endedAt: new Date(),
    });
  }
}
