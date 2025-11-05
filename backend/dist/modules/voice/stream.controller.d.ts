import { Response } from 'express';
import { Observable } from 'rxjs';
import { StreamService } from './stream.service';
interface AudioStreamPayload {
    audioData: string;
    userId: string;
}
interface MessageEvent {
    data: string | object;
}
export declare class StreamController {
    private streamService;
    constructor(streamService: StreamService);
    handleAudioStream(payload: AudioStreamPayload, res: Response): Promise<any>;
    streamEvents(res: Response): Observable<MessageEvent>;
    handleEndCall(payload: {
        userId: string;
    }, res: Response): Promise<any>;
}
export {};
