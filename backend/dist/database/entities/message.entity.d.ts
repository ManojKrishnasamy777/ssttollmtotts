import { Conversation } from './conversation.entity';
export declare class Message {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: Date;
    conversation: Conversation;
}
