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
  }

  async textToSpeech(text: string): Promise<Buffer> {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('ElevenLabs error:', error);
      throw error;
    }
  }
}
