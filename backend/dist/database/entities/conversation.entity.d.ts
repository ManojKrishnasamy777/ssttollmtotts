import { Message } from './message.entity';
export declare class Conversation {
    id: string;
    userId: string;
    createdAt: Date;
    endedAt: Date;
    messages: Message[];
}
