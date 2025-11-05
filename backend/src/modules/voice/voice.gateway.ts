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
import { STTFactoryService } from './stt-factory.service';
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
    private sttFactory: STTFactoryService,
    private openaiService: OpenAIService,
    private elevenlabsService: ElevenLabsService,
    private conversationService: ConversationService,
  ) { }

  async handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`);

    try {
      const conversationId = await this.conversationService.createConversation(client.id);
      console.log(`[WS] Created conversation: ${conversationId} for client: ${client.id}`);

      const audioQueue: Buffer[] = [];
      const sttService = this.sttFactory.getSTTService();

      const sttConnection = await sttService.createLiveTranscription(
        async (transcript) => {
          console.log(`[STT] Transcript received: "${transcript}"`);
          client.emit('transcript', { text: transcript });

          await this.conversationService.addMessage(conversationId, 'user', transcript);
          console.log(`[Conversation] User message saved: "${transcript}"`);

          const messages = await this.conversationService.getConversationHistory(conversationId);
          console.log('[Conversation] Full conversation history:', messages);
          const userId = 'user123';
          const aiResponse = await this.openaiService.generateResponse(userId, messages);
          console.log(`[OpenAI] Response generated: "${aiResponse}"`);

          await this.conversationService.addMessage(conversationId, 'assistant', aiResponse);
          console.log('[Conversation] Assistant message saved');

          client.emit('ai-response', { text: aiResponse });

          const audioBuffer = await this.elevenlabsService.textToSpeech(aiResponse);
          console.log(`[ElevenLabs] Audio buffer generated: ${audioBuffer.length} bytes`);

          client.emit('audio', audioBuffer);
        },
        (error) => {
          console.error('[STT] Error:', error);
          client.emit('error', { message: 'Speech recognition error', details: error });
        },
      );

      if (sttConnection.on) {
        sttConnection.on('open', () => {
          console.log(`[STT] Connection opened for client: ${client.id}, flushing queued audio...`);
          audioQueue.forEach((chunk) => sttService.sendAudio(sttConnection, chunk));
          audioQueue.length = 0;
        });
      }

      console.log(`[WS] STT connection established for client: ${client.id}`);

      this.activeConnections.set(client.id, {
        sttConnection,
        sttService,
        conversationId,
        audioQueue,
      });
    } catch (err) {
      console.error(`[WS] Error during connection setup for client ${client.id}:`, err);
      client.emit('error', { message: 'Connection setup failed', details: err });
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`);
    const connection = this.activeConnections.get(client.id);

    if (connection) {
      console.log(`[WS] Closing STT connection for client: ${client.id}`);
      connection.sttService.closeConnection(connection.sttConnection);

      console.log(`[Conversation] Ending conversation: ${connection.conversationId}`);
      this.conversationService.endConversation(connection.conversationId);

      this.activeConnections.delete(client.id);
      console.log(`[WS] Connection removed for client: ${client.id}`);
    }
  }

  @SubscribeMessage('audio-data')
  handleAudioData(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const connection = this.activeConnections.get(client.id);
    const audioBuffer = Buffer.from(data);

    if (connection && connection.sttConnection) {
      const isReady = connection.sttConnection.getReadyState
        ? connection.sttConnection.getReadyState() === 1
        : connection.sttConnection.readyState === 1;

      if (isReady) {
        console.log(`[WS] Sending audio buffer of length: ${audioBuffer.length} for client: ${client.id}`);
        connection.sttService.sendAudio(connection.sttConnection, audioBuffer);
      } else {
        console.log(`[WS] STT not ready, queueing audio chunk of size: ${audioBuffer.length} for client: ${client.id}`);
        connection.audioQueue.push(audioBuffer);
      }
    } else {
      console.warn(`[WS] No active STT connection for client: ${client.id}`);
    }
  }

  @SubscribeMessage('stop-speaking')
  handleStopSpeaking(@ConnectedSocket() client: Socket) {
    console.log(`[WS] Stop speaking requested by client: ${client.id}`);
    client.emit('stop-audio');
  }
}
