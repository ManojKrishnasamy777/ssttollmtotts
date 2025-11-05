import { Controller, Post, Body, Res, HttpStatus, Sse } from '@nestjs/common';
import { Response } from 'express';
import { Observable, Subject } from 'rxjs';
import { StreamService } from './stream.service';

interface AudioStreamPayload {
  audioData: string;
  userId: string;
}

interface MessageEvent {
  data: string | object;
}

@Controller('stream')
export class StreamController {
  constructor(private streamService: StreamService) {}

  @Post('audio')
  async handleAudioStream(@Body() payload: AudioStreamPayload, @Res() res: Response) {
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

  @Sse('events/:userId')
  streamEvents(@Res() res: Response): Observable<MessageEvent> {
    const userId = res.req.params.userId;
    console.log(`[SSE] Client connected: ${userId}`);

    const subject = new Subject<MessageEvent>();

    this.streamService.registerClient(userId, (event) => {
      subject.next({ data: JSON.stringify(event) });
    });

    res.on('close', () => {
      console.log(`[SSE] Client disconnected: ${userId}`);
      this.streamService.unregisterClient(userId);
      subject.complete();
    });

    return subject.asObservable();
  }

  @Post('end-call')
  async handleEndCall(@Body() payload: { userId: string }, @Res() res: Response) {
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
}
