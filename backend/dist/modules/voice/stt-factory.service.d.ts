import { ConfigService } from '@nestjs/config';
import { DeepgramService } from './deepgram.service';
import { SarvamService } from './sarvam.service';
import { STTService } from './stt.interface';
export declare class STTFactoryService {
    private configService;
    private deepgramService;
    private sarvamService;
    constructor(configService: ConfigService, deepgramService: DeepgramService, sarvamService: SarvamService);
    getSTTService(): STTService;
}
