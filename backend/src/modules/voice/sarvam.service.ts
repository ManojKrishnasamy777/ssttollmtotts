import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-ignore: 'sarvamai' has no type declarations in this project
import { SarvamAIClient } from 'sarvamai';
import { STTService } from './stt.interface';

// Define the type for the connection wrapper
interface SarvamConnectionWrapper {
  connection: any;
  listener: Promise<void> | null;
  send: (audioData: Buffer) => Promise<void>;
  finish: () => Promise<void>;
  getReadyState: () => number;
}

@Injectable()
export class SarvamService implements STTService {
  private sarvamClient: SarvamAIClient;
  // NOTE: Changed from 'en-IN' to 'ta-IN' based on your provided code
  private readonly DEFAULT_LANGUAGE_CODE = 'ta-IN';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('SARVAM_API_KEY');
    console.log('--- DEBUG START ---');
    console.log(`[Sarvam Init] Initializing client with API key: ${apiKey ? 'FOUND' : 'MISSING'}`);

    this.sarvamClient = new SarvamAIClient({
      apiSubscriptionKey: apiKey,
    });
  }

  async createLiveTranscription(
    onTranscript: (text: string) => void,
    onError: (error: any) => void
  ): Promise<SarvamConnectionWrapper> {
    console.log('[Sarvam Connect] Creating live transcription connection...');
    console.log(`[Sarvam Connect] Config: Language=${this.DEFAULT_LANGUAGE_CODE}, Codec='pcm_s16le', SampleRate=16000`);

    try {
      const connection = await this.sarvamClient.speechToTextStreaming.connect({
        'language-code': this.DEFAULT_LANGUAGE_CODE,
        input_audio_codec: 'pcm_s16le',
        sample_rate: 16000,
      });

      // --- CONNECTION STATUS & ERROR LOGS ---
      // WebSocket 'open' event is not always directly exposed, but we can assume success here.
      console.log('[Sarvam Connect] **Connection established successfully.**');

      connection.on('message', (response) => {
        const responseAny: any = response;
        let transcript: string | undefined;

        console.log(`[Sarvam Event] RECEIVED MESSAGE: ${JSON.stringify(responseAny)}`);

        if (responseAny.type === 'error') {
          console.error(`[Sarvam Event] Error in response: ${JSON.stringify(responseAny)}`);
          return;
        }

        // Try multiple possible paths for Sarvam response
        transcript = responseAny.transcript ||
          responseAny.data?.transcript ||
          responseAny.text ||
          responseAny.data?.text ||
          responseAny.results?.[0]?.transcript ||
          responseAny.transcription;

        if (transcript && transcript.trim().length > 0) {
          console.log(`[Sarvam Transcript] **TRANSCRIBED TEXT:** ${transcript}`);
          onTranscript(transcript);
        } else if (responseAny.type !== 'partial') {
          console.log('[Sarvam Event] Received message without transcript:', JSON.stringify(responseAny, null, 2));
        }
      });

      connection.on('error', (error) => {
        console.error(`[Sarvam Event] **ERROR EVENT:** ${JSON.stringify(error, null, 2)}`);
        onError(error);
      });

      connection.on('close', () => {
        console.log('[Sarvam Event] **CONNECTION CLOSED.**');
        // Clear any interval/timeout cleanup here if you had a keep-alive
      });
      // ------------------------------------------

      const sarvamConnectionWrapper: SarvamConnectionWrapper = {
        connection,
        listener: null,

        send: async (audioData: Buffer) => {
          const state = connection.readyState ?? 0;
          if (state === 1) {
            try {
              const audioBase64 = audioData.toString('base64');
              await connection.transcribe({ audio: audioBase64 });
            } catch (error) {
              console.error('[Sarvam Send] Error sending audio:', error);
            }
          } else {
            console.warn(`[Sarvam Send] WARNING: Connection not ready (state=${state})`);
          }
        },

        finish: async () => {
          console.log('[Sarvam Close] Closing connection...');
          await connection.transcribe({ audio: '' });
          await new Promise(resolve => setTimeout(resolve, 500));
          await connection.close();
        },

        getReadyState: () => connection.readyState ?? 0
      };

      return sarvamConnectionWrapper;

    } catch (error) {
      console.error(`[Sarvam Connect] **FATAL CONNECTION ERROR:** ${error}`);
      onError(error);
      return {
        connection: null,
        listener: null,
        send: async () => console.warn('[Sarvam Send] Connection failed, cannot send audio'),
        finish: async () => console.warn('[Sarvam Close] Connection failed, nothing to close'),
        getReadyState: () => 0
      };
    }
  }

  sendAudio(connection: SarvamConnectionWrapper, audioData: Buffer) {
    if (!connection) {
      console.warn('[Sarvam Send] No connection wrapper to send audio.');
      return;
    }

    const state = connection.getReadyState();
    // The send logic is now fully contained within the wrapper's 'send' method for consistent logging.
    connection.send(audioData);
  }

  closeConnection(connection: SarvamConnectionWrapper) {
    if (connection) {
      connection.finish();
    } else {
      console.warn('[Sarvam Close] No connection wrapper to close.');
    }
  }
}