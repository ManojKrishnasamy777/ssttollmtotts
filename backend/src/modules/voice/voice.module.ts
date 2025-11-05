import { Module } from '@nestjs/common';
import { VoiceGateway } from './voice.gateway';
import { DeepgramService } from './deepgram.service';
import { SarvamService } from './sarvam.service';
import { STTFactoryService } from './stt-factory.service';
import { OpenAIService } from './openai.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [ConversationModule],
  providers: [
    VoiceGateway,
    DeepgramService,
    SarvamService,
    STTFactoryService,
    OpenAIService,
    ElevenLabsService,
  ],
})
export class VoiceModule {}
