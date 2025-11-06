import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
export declare class ConversationService {
    private conversationRepository;
    private messageRepository;
    constructor(conversationRepository: Repository<Conversation>, messageRepository: Repository<Message>);
    createConversation(userId: string): Promise<string>;
    addMessage(conversationId: string, role: string, content: string): Promise<void>;
    getConversationHistory(conversationId: string): Promise<Array<{
        role: string;
        content: string;
    }>>;
    endConversation(conversationId: string): Promise<void>;
}
