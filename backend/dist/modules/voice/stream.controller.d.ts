import { Response } from 'express';
import { Observable } from 'rxjs';
import { StreamService } from './stream.service';
import { SarvamService } from './sarvam.service';
interface AudioStreamPayload {
    audioData: string;
    userId: string;
}
interface MessageEvent {
    data: string | object;
}
export declare class StreamController {
    private readonly streamService;
    private readonly _SarvamService;
    constructor(streamService: StreamService, _SarvamService: SarvamService);
    handleAudioStream(payload: AudioStreamPayload, res: Response): Promise<any>;
    streamEvents(userId: string, res: Response): Observable<MessageEvent>;
    handleEndCall(payload: any, res: Response): Promise<any>;
}
export {};
