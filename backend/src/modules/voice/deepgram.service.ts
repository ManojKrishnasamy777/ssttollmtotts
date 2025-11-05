import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

@Injectable()
export class DeepgramService {
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
      smart_format: true,
      interim_results: false,
    });

    connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection opened');
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
      console.error('Deepgram error event:', error);
      onError(error);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('Deepgram connection closed');
    });

    return connection;
  }

  sendAudio(connection: any, audioData: Buffer) {
    if (!connection) {
      console.warn('No connection to send audio');
      return;
    }

    console.log('Connection ready state:', connection.getReadyState());
    if (connection.getReadyState() === 1) {
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
