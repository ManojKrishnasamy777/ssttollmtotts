import { Module } from '@nestjs/common';
import { VoiceGateway } from './voice.gateway';
import { DeepgramService } from './deepgram.service';
import { OpenAIService } from './openai.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [ConversationModule],
  providers: [VoiceGateway, DeepgramService, OpenAIService, ElevenLabsService],
})
export class VoiceModule {}
