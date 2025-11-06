import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepgramService } from './deepgram.service';
import { SarvamService } from './sarvam.service';
import { STTService } from './stt.interface';

@Injectable()
export class STTFactoryService {
  constructor(
    private configService: ConfigService,
    private deepgramService: DeepgramService,
    private sarvamService: SarvamService,
  ) { }

  getSTTService(): STTService {
    const provider = this.configService.get('STT_PROVIDER') || 'deepgram';
    console.log(`Using STT provider: ${provider}`);

    switch (provider.toLowerCase()) {
      case 'sarvam':
        return this.sarvamService;
      case 'deepgram':
      default:
        return this.deepgramService;
    }
  }
}
