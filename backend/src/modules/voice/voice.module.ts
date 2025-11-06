import { Module } from '@nestjs/common';
import { DeepgramService } from './deepgram.service';
import { SarvamService } from './sarvam.service';
import { OpenAIService } from './openai.service';
import { ElevenLabsService } from './elevenlabs.service';
import { STTFactoryService } from './stt-factory.service';
import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [ConversationModule],
  controllers: [StreamController],
  providers: [
    DeepgramService,
    SarvamService,
    OpenAIService,
    ElevenLabsService,
    STTFactoryService,
    StreamService,
  ],
  exports: [StreamService],
})
export class VoiceModule {}
