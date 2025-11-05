import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SarvamService {
  private apiKey: string;
  private wsUrl = 'wss://api.sarvam.ai/speech-to-text-translate';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('SARVAM_API_KEY');
    console.log('Initializing Sarvam client with API key:', this.apiKey ? 'FOUND' : 'MISSING');
  }

  async createLiveTranscription(
    onTranscript: (text: string) => void,
    onError: (error: any) => void
  ) {
    console.log('Creating Sarvam live transcription connection...');

    const WebSocket = (await import('ws')).default;

    const ws = new WebSocket(this.wsUrl, {
      headers: {
        'api-subscription-key': this.apiKey,
      },
    });

    ws.on('open', () => {
      console.log('Sarvam WebSocket connection opened');

      const config = {
        language_code: 'en-IN',
        model: 'saarika:v1',
        format: 'pcm',
        sample_rate: 16000,
      };

      ws.send(JSON.stringify(config));
    });

    ws.on('message', (data: Buffer) => {
      try {
        const response = JSON.parse(data.toString());
        console.log('Received Sarvam message:', response);

        if (response.type === 'transcript' && response.text) {
          const transcript = response.text.trim();
          if (transcript.length > 0) {
            console.log('Sarvam transcribed text:', transcript);
            onTranscript(transcript);
          }
        }
      } catch (error) {
        console.error('Error parsing Sarvam message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('Sarvam WebSocket error:', error);
      onError(error);
    });

    ws.on('close', () => {
      console.log('Sarvam WebSocket connection closed');
    });

    return ws;
  }

  sendAudio(connection: any, audioData: Buffer) {
    if (!connection) {
      console.warn('No Sarvam connection to send audio');
      return;
    }

    if (connection.readyState === 1) {
      console.log('Sending audio buffer to Sarvam, length:', audioData.length);
      connection.send(audioData);
    } else {
      console.warn('Sarvam connection not open, cannot send audio');
    }
  }

  closeConnection(connection: any) {
    if (!connection) {
      console.warn('No Sarvam connection to close');
      return;
    }

    console.log('Closing Sarvam connection...');
    connection.close();
  }
}
