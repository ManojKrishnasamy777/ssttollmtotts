import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

@Injectable()
export class DeepgramService {
  private deepgram;

  constructor(private configService: ConfigService) {
    this.deepgram = createClient(this.configService.get('DEEPGRAM_API_KEY'));
  }

  async createLiveTranscription(onTranscript: (text: string) => void, onError: (error: any) => void) {
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
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (transcript && transcript.trim().length > 0) {
        onTranscript(transcript);
      }
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('Deepgram error:', error);
      onError(error);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('Deepgram connection closed');
    });

    return connection;
  }

  sendAudio(connection: any, audioData: Buffer) {
    if (connection && connection.getReadyState() === 1) {
      connection.send(audioData);
    }
  }

  closeConnection(connection: any) {
    if (connection) {
      connection.finish();
    }
  }
}
