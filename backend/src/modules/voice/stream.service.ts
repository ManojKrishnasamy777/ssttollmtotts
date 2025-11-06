import { Injectable } from '@nestjs/common';
import { STTFactoryService } from './stt-factory.service';
import { OpenAIService } from './openai.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ConversationService } from '../conversation/conversation.service';

interface StreamConnection {
  conversationId: string;
  sttConnection: any;
  audioQueue: Buffer[];
  lastActivityTime: number;
  eventCallback?: (event: any) => void;
  firstMessageSent: boolean;
}

@Injectable()
export class StreamService {
  private connections = new Map<string, StreamConnection>();
  private readonly VAD_THRESHOLD = 0.02;

  constructor(
    private sttFactory: STTFactoryService,
    private openaiService: OpenAIService,
    private elevenlabsService: ElevenLabsService,
    private conversationService: ConversationService,
  ) {
    this.startCleanupTask();
  }

  async registerClient(userId: string, eventCallback: (event: any) => void): Promise<void> {
    console.log(`[Stream] Registering client: ${userId}`);

    const conversationId = await this.conversationService.createConversation(userId);
    console.log(`[Stream] Created conversation: ${conversationId}`);

    const sttService = this.sttFactory.getSTTService();

    const sttConnection = await sttService.createLiveTranscription(
      async (transcript) => {
        console.log(`[STT] Transcript: "${transcript}"`);

        eventCallback({
          type: 'transcript',
          text: transcript,
        });

        await this.conversationService.addMessage(conversationId, 'user', transcript);

        const messages = await this.conversationService.getConversationHistory(conversationId);
        const aiResponse = await this.openaiService.generateResponse(userId, messages);

        console.log(`[AI] Response: "${aiResponse}"`);

        await this.conversationService.addMessage(conversationId, 'assistant', aiResponse);

        eventCallback({
          type: 'ai-response',
          text: aiResponse,
        });

        const audioBuffer = await this.elevenlabsService.textToSpeech(aiResponse);

        console.log(`[TTS] Generated audio: ${audioBuffer.length} bytes`);

        eventCallback({
          type: 'audio',
          data: audioBuffer.toString('base64'),
        });
      },
      (error) => {
        console.error('[STT] Error:', error);
        eventCallback({
          type: 'error',
          error: error.message,
        });
      },
    );

    const connection: StreamConnection = {
      conversationId,
      sttConnection,
      audioQueue: [],
      lastActivityTime: Date.now(),
      eventCallback,
      firstMessageSent: false,
    };

    this.connections.set(userId, connection);

    setTimeout(async () => {
      if (!connection.firstMessageSent) {
        const messages = await this.conversationService.getConversationHistory(conversationId);
        const greeting = await this.openaiService.generateResponse(userId, messages);

        console.log(`[AI] Initial greeting: "${greeting}"`);

        await this.conversationService.addMessage(conversationId, 'assistant', greeting);

        eventCallback({
          type: 'ai-response',
          text: greeting,
        });

        const audioBuffer = await this.elevenlabsService.textToSpeech(greeting);

        eventCallback({
          type: 'audio',
          data: audioBuffer.toString('base64'),
        });

        connection.firstMessageSent = true;
      }
    }, 500);
  }

  async processAudio(userId: string, audioData: Buffer): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      console.warn(`[Stream] No connection found for user: ${userId}`);
      return;
    }

    connection.lastActivityTime = Date.now();

    const rms = this.calculateRMS(audioData);

    if (rms > this.VAD_THRESHOLD) {
      console.log(`[VAD] Voice detected (RMS: ${rms.toFixed(4)})`);

      const sttService = this.sttFactory.getSTTService();

      if (connection.sttConnection) {
        sttService.sendAudio(connection.sttConnection, audioData);
      }
    }
  }

  private calculateRMS(buffer: Buffer): number {
    let sum = 0;
    const samples = buffer.length / 2;

    for (let i = 0; i < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i) / 32768.0;
      sum += sample * sample;
    }

    return Math.sqrt(sum / samples);
  }

  async unregisterClient(userId: string): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      return;
    }

    console.log(`[Stream] Unregistering client: ${userId}`);

    const sttService = this.sttFactory.getSTTService();
    sttService.closeConnection(connection.sttConnection);

    await this.conversationService.endConversation(connection.conversationId);

    this.connections.delete(userId);
  }

  async endCall(userId: string): Promise<void> {
    await this.unregisterClient(userId);
  }

  private startCleanupTask(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = 5 * 60 * 1000;

      for (const [userId, connection] of this.connections.entries()) {
        if (now - connection.lastActivityTime > timeout) {
          console.log(`[Stream] Cleaning up inactive connection: ${userId}`);
          this.unregisterClient(userId);
        }
      }
    }, 60000);
  }
}
