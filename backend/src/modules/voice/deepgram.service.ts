import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { STTService } from './stt.interface';

@Injectable()
export class DeepgramService implements STTService {
  private deepgram;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('DEEPGRAM_API_KEY');
    console.log('Initializing Deepgram client with API key:', apiKey ? 'FOUND' : 'MISSING');
    this.deepgram = createClient(apiKey);
  }

  async createLiveTranscription(
    onTranscript: (text: string) => void,
    onError: (error: any) => void
  ) {
    console.log('Creating live transcription connection...');

    const connection = this.deepgram.listen.live({
      model: 'nova-2',
      language: 'en-US',
      encoding: 'linear16',
      sample_rate: 16000,
      smart_format: true,
      interim_results: false,
    });

    let keepAliveInterval: NodeJS.Timeout | null = null;

    connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection opened');

      // Send periodic silence (keep alive)
      keepAliveInterval = setInterval(() => {
        if (connection && connection.getReadyState() === 1) {
          const silence = Buffer.alloc(3200); // ~100ms of silence @ 16kHz PCM16
          connection.send(silence);
          // console.log('Sent keep-alive silence');
        }
      }, 1000);
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      console.log('Received transcript event:', JSON.stringify(data));
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (transcript && transcript.trim().length > 0) {
        console.log('Transcribed text:', transcript);
        onTranscript(transcript);
      } else {
        console.log('Transcript empty or undefined');
      }
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('Deepgram error event:', JSON.stringify(error, null, 2));
      onError(error);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('Deepgram connection closed');
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
    });

    return connection;
  }

  sendAudio(connection: any, audioData: Buffer) {
    if (!connection) {
      console.warn('No connection to send audio');
      return;
    }

    const state = connection.getReadyState();
    console.log('Connection ready state:', state);

    if (state === 1) {
      console.log('Sending audio buffer of length:', audioData.length);
      connection.send(audioData);
    } else {
      console.warn('Connection not open, cannot send audio');
    }
  }

  closeConnection(connection: any) {
    if (!connection) {
      console.warn('No connection to close');
      return;
    }

    console.log('Closing Deepgram connection...');
    connection.finish();
  }
}
