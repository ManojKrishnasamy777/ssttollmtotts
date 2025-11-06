import { Module } from '@nestjs/common';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { DeepgramService } from './deepgram.service';
import { STTFactoryService } from './stt-factory.service';
import { OpenAIService } from './openai.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [ConversationModule],
  controllers: [StreamController],
  providers: [
    StreamService,
    DeepgramService,
    STTFactoryService,
    OpenAIService,
    ElevenLabsService,
  ],
})
export class VoiceModule {}
