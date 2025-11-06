import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STTService } from './stt.interface';
import WebSocket from 'ws';

@Injectable()
export class SarvamService implements STTService {
  private apiKey: string;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SARVAM_API_KEY');
    this.endpoint = this.configService.get<string>('SARVAM_STREAM_URL')
      || 'wss://streaming.sarvam.ai/speech-to-text/stream'; // hypothetical
    if (!this.apiKey) {
      console.warn('Sarvam API key missing');
    }
  }

  async createLiveTranscription(
    onTranscript: (text: string) => void,
    onError: (error: any) => void
  ) {
    console.log('Connecting to Sarvam streaming endpoint…');

    const connection = new WebSocket(this.endpoint, {
      headers: { "api-subscription-key": this.apiKey }
    });

    connection.on('open', () => {
      console.log('Sarvam WebSocket open');
      // you may need to send a config message
      const configMsg = {
        type: 'config',
        data: {
          model: 'saarika:v2.5',
          language_code: 'en‑IN',
          // other params: interim_results, etc
          interim_results: false,
        }
      };
      connection.send(JSON.stringify(configMsg));
    });

    connection.on('message', (msgRaw) => {
      try {
        const msg = JSON.parse(msgRaw.toString());
        if (msg.type === 'transcript' && msg.data?.text) {
          const text = msg.data.text.trim();
          if (text.length > 0) {
            console.log('Transcribed:', text);
            onTranscript(text);
          }
        }
      } catch (err) {
        console.error('Parsing Sarvam message error', err);
      }
    });

    connection.on('error', (err) => {
      console.error('Sarvam WebSocket error', err);
      onError(err);
    });

    connection.on('close', (code, reason) => {
      console.log(`Sarvam connection closed ${code} ${reason}`);
    });

    return connection;
  }

  sendAudio(connection: WebSocket, audioData: Buffer) {
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      console.warn('Sarvam connection not open');
      return;
    }
    // Depending on Sarvam spec you might send binary frames
    console.log('Sending audio buffer length:', audioData.length);
    connection.send(audioData);
  }

  closeConnection(connection: WebSocket) {
    if (!connection) {
      return;
    }
    console.log('Closing Sarvam connection');
    connection.close();
  }
}
