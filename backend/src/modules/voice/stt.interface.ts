export interface STTService {
  createLiveTranscription(
    onTranscript: (text: string) => void,
    onError: (error: any) => void
  ): Promise<any>;

  sendAudio(connection: any, audioData: Buffer): void;

  closeConnection(connection: any): void;
}
