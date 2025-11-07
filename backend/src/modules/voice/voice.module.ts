import { Module } from '@nestjs/common';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { DeepgramService } from './deepgram.service';
import { SarvamService } from './sarvam.service';
import { STTFactoryService } from './stt-factory.service';
import { OpenAIService } from './openai.service';
import { GeminiService } from './gemini.service';
import { LLMFactoryService } from './llm-factory.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [ConversationModule],
  controllers: [StreamController],
  providers: [
    StreamService,
    DeepgramService,
    SarvamService,
    STTFactoryService,
    OpenAIService,
    GeminiService,
    LLMFactoryService,
    ElevenLabsService,
  ],
})
export class VoiceModule {}
