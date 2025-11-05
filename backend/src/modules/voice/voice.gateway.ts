import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DeepgramService } from './deepgram.service';
import { OpenAIService } from './openai.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ConversationService } from '../conversation/conversation.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeConnections = new Map<string, any>();

  constructor(
    private deepgramService: DeepgramService,
    private openaiService: OpenAIService,
    private elevenlabsService: ElevenLabsService,
    private conversationService: ConversationService,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    const conversationId = await this.conversationService.createConversation(client.id);

    const deepgramConnection = await this.deepgramService.createLiveTranscription(
      async (transcript) => {
        console.log('Transcript:', transcript);
        client.emit('transcript', { text: transcript });

        await this.conversationService.addMessage(conversationId, 'user', transcript);

        const messages = await this.conversationService.getConversationHistory(conversationId);

        const aiResponse = await this.openaiService.generateResponse(messages);
        console.log('AI Response:', aiResponse);

        await this.conversationService.addMessage(conversationId, 'assistant', aiResponse);

        client.emit('ai-response', { text: aiResponse });

        const audioBuffer = await this.elevenlabsService.textToSpeech(aiResponse);
        client.emit('audio', audioBuffer);
      },
      (error) => {
        console.error('Deepgram error:', error);
        client.emit('error', { message: 'Speech recognition error' });
      }
    );

    this.activeConnections.set(client.id, {
      deepgramConnection,
      conversationId,
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const connection = this.activeConnections.get(client.id);

    if (connection) {
      this.deepgramService.closeConnection(connection.deepgramConnection);
      this.conversationService.endConversation(connection.conversationId);
      this.activeConnections.delete(client.id);
    }
  }

  @SubscribeMessage('audio-data')
  handleAudioData(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const connection = this.activeConnections.get(client.id);

    if (connection && connection.deepgramConnection) {
      const audioBuffer = Buffer.from(data);
      this.deepgramService.sendAudio(connection.deepgramConnection, audioBuffer);
    }
  }

  @SubscribeMessage('stop-speaking')
  handleStopSpeaking(@ConnectedSocket() client: Socket) {
    client.emit('stop-audio');
  }
}
