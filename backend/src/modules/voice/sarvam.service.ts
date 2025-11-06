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

    let keepAliveInterval: NodeJS.Timeout | null = null;

    connection.on('open', () => {
      console.log('Sarvam WebSocket connection opened');

      const configMsg = {
        config: {
          model: 'saarika:v1',
          language_code: 'en-IN',
          sample_rate: 16000,
          encoding: 'LINEAR16'
        }
      };

      console.log('Sending Sarvam config:', JSON.stringify(configMsg));
      connection.send(JSON.stringify(configMsg));

      keepAliveInterval = setInterval(() => {
        if (connection && connection.readyState === WebSocket.OPEN) {
          const silence = Buffer.alloc(3200);
          connection.send(silence);
        }
      }, 5000);
    });

    connection.on('message', (msgRaw) => {
      try {
        const msgStr = msgRaw.toString();
        console.log('Sarvam raw message:', msgStr);

        const msg = JSON.parse(msgStr);
        console.log('Sarvam parsed message:', JSON.stringify(msg));

        if (msg.type === 'transcript' || msg.transcript) {
          const text = (msg.transcript || msg.text || msg.data?.text || '').trim();
          if (text.length > 0) {
            console.log('Sarvam transcribed text:', text);
            onTranscript(text);
          }
        } else if (msg.type === 'final' && msg.text) {
          const text = msg.text.trim();
          if (text.length > 0) {
            console.log('Sarvam final transcript:', text);
            onTranscript(text);
          }
        } else if (msg.is_final && msg.transcript) {
          const text = msg.transcript.trim();
          if (text.length > 0) {
            console.log('Sarvam final transcript (is_final):', text);
            onTranscript(text);
          }
        }
      } catch (err) {
        console.error('Error parsing Sarvam message:', err);
        console.error('Raw message was:', msgRaw.toString());
      }
    });

    connection.on('error', (err) => {
      console.error('Sarvam WebSocket error:', err);
      onError(err);
    });

    connection.on('close', (code, reason) => {
      console.log(`Sarvam connection closed ${code} ${reason}`);
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
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
