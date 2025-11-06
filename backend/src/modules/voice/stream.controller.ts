import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Sse,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, Subject } from 'rxjs';
import { StreamService } from './stream.service';
// import { ApiTags } from '@nestjs/swagger';
import { SarvamService } from './sarvam.service';

interface AudioStreamPayload {
  audioData: string;
  userId: string;
}

interface MessageEvent {
  data: string | object;
}

@Controller({ path: 'stream', version: '1' })
// @ApiTags('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService, private readonly _SarvamService: SarvamService) { }

  // 🟢 Receive audio from client (POST)
  @Post('audio')
  async handleAudioStream(
    @Body() payload: AudioStreamPayload,
    @Res() res: Response,
  ) {
    try {
      const audioBuffer = Buffer.from(payload.audioData, 'base64');
      await this.streamService.processAudio(payload.userId, audioBuffer);

      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      console.error('[Stream] Error handling audio:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to process audio',
      });
    }
  }

  // 🟣 SSE endpoint — do NOT inject @Res() here!
  @Sse('events/:userId')
  streamEvents(@Param('userId') userId: string, @Res() res: Response): Observable<MessageEvent> {

    console.log(`[SSE] Client connected: ${userId}`);

    const subject = new Subject<MessageEvent>();

    // register client with callback
    this.streamService.registerClient(userId, (event) => {
      subject.next({ data: JSON.stringify(event) });
    });

    // auto cleanup on unsubscribe (when SSE disconnects)
    const cleanup = () => {
      console.log(`[SSE] Client disconnected: ${userId}`);
      this.streamService.unregisterClient(userId);
      subject.complete();
    };

    // handle manual unsubscribe or browser close
    subject.subscribe({ complete: cleanup });

    // optional: heartbeat to keep connection alive
    const interval = setInterval(() => {
      subject.next({ data: JSON.stringify({ type: 'ping', time: Date.now() }) });
    }, 15000);

    // stop heartbeats on disconnect
    subject.subscribe({
      complete: () => clearInterval(interval),
    });

    return subject.asObservable();
  }

  @Post('end-call')
  async handleEndCall(@Body() payload: any, @Res() res: Response) {
    try {
      console.log(`[Stream] Ending call for user: ${payload.userId}`);
      await this.streamService.endCall(payload.userId);
      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      console.error('[Stream] Error ending call:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to end call',
      });
    }
  }

  // @Post('translate')
  // async translate(@Body() body: any) {
  //   let text = 'hello';
  //   let targetLang = 'ta-IN';
  //   const translatedText = await this._SarvamService.translateText(text, targetLang);
  //   return { translatedText };
  // }
}
