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
  isAiSpeaking: boolean;
  pendingUserInput: string[];
  aiResponseInProgress: boolean;
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

        const conn = this.connections.get(userId);
        if (!conn) return;

        // If AI is speaking, queue the user input for later processing
        if (conn.isAiSpeaking || conn.aiResponseInProgress) {
          console.log(`[Interrupt] User interrupted AI. Queuing input: "${transcript}"`);
          conn.pendingUserInput.push(transcript);

          // Signal to stop AI speaking
          eventCallback({
            type: 'ai-interrupted',
            text: 'User interrupted',
          });

          conn.isAiSpeaking = false;
          return;
        }

        await this.processUserInput(userId, conversationId, transcript, eventCallback);
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
      isAiSpeaking: false,
      pendingUserInput: [],
      aiResponseInProgress: false,
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
        connection.isAiSpeaking = true;

        // Mark AI as done speaking after greeting
        setTimeout(() => {
          connection.isAiSpeaking = false;
        }, Math.max(3000, greeting.length * 50));
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

  private async processUserInput(
    userId: string,
    conversationId: string,
    transcript: string,
    eventCallback: (event: any) => void
  ): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) return;

    try {
      connection.aiResponseInProgress = true;

      await this.conversationService.addMessage(conversationId, 'user', transcript);

      // Check if there are pending interruptions
      if (connection.pendingUserInput.length > 0) {
        console.log(`[Interrupt] Processing pending inputs after AI was interrupted`);
        const allInputs = connection.pendingUserInput.join(' ');
        connection.pendingUserInput = [];

        await this.conversationService.addMessage(conversationId, 'user', allInputs);
      }

      const messages = await this.conversationService.getConversationHistory(conversationId);
      const aiResponse = await this.openaiService.generateResponse(userId, messages);

      console.log(`[AI] Response: "${aiResponse}"`);

      // Check again if user interrupted during AI processing
      if (connection.pendingUserInput.length > 0) {
        console.log(`[Interrupt] User interrupted during AI processing. Reprocessing...`);
        const pendingInputs = connection.pendingUserInput.join(' ');
        connection.pendingUserInput = [];
        connection.aiResponseInProgress = false;
        await this.processUserInput(userId, conversationId, pendingInputs, eventCallback);
        return;
      }

      await this.conversationService.addMessage(conversationId, 'assistant', aiResponse);

      eventCallback({
        type: 'ai-response',
        text: aiResponse,
      });

      connection.isAiSpeaking = true;
      const audioBuffer = await this.elevenlabsService.textToSpeech(aiResponse);

      console.log(`[TTS] Generated audio: ${audioBuffer.length} bytes`);

      // Check one more time before sending audio
      if (connection.pendingUserInput.length > 0) {
        console.log(`[Interrupt] User interrupted before audio playback. Skipping audio...`);
        const pendingInputs = connection.pendingUserInput.join(' ');
        connection.pendingUserInput = [];
        connection.isAiSpeaking = false;
        connection.aiResponseInProgress = false;
        await this.processUserInput(userId, conversationId, pendingInputs, eventCallback);
        return;
      }

      eventCallback({
        type: 'audio',
        data: audioBuffer.toString('base64'),
      });

      connection.aiResponseInProgress = false;

      // Set a timeout to mark AI as done speaking (approximate audio duration)
      setTimeout(() => {
        if (connection.isAiSpeaking) {
          connection.isAiSpeaking = false;
          console.log(`[AI] Finished speaking`);

          // Process any pending inputs after AI finishes
          if (connection.pendingUserInput.length > 0) {
            const pendingInputs = connection.pendingUserInput.join(' ');
            connection.pendingUserInput = [];
            this.processUserInput(userId, conversationId, pendingInputs, eventCallback);
          }
        }
      }, Math.max(3000, aiResponse.length * 50));

    } catch (error) {
      console.error('[Stream] Error processing user input:', error);
      connection.aiResponseInProgress = false;
      connection.isAiSpeaking = false;
      eventCallback({
        type: 'error',
        error: error.message,
      });
    }
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
