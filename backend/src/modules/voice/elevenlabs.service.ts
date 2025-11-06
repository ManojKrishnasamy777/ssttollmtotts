import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ElevenLabsService {
  private apiKey: string;
  private voiceId: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('ELEVENLABS_API_KEY');
    this.voiceId = this.configService.get('ELEVENLABS_VOICE_ID');

    console.log(
      'Initializing ElevenLabsService. API Key:',
      this.apiKey ? 'FOUND' : 'MISSING',
      'Voice ID:',
      this.voiceId || 'MISSING'
    );
  }

  async textToSpeech(text: string): Promise<Buffer> {
    console.log('Sending text to ElevenLabs TTS:', text);

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          text,
          model_id: 'eleven_flash_v2',
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.85,
            style: 0.4,
            use_speaker_boost: true,
            stochasticity: 0.2
          },
        },
        {
          headers: {
            Accept: 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      console.log(
        'ElevenLabs TTS request successful. Response size:',
        response.data.byteLength,
        'bytes'
      );
      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('ElevenLabs Axios error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        console.error('ElevenLabs unknown error:', error);
      }
      throw error;
    }
  }
}
