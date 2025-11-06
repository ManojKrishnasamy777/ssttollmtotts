class StreamService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private userId: string = '38db6a01-b3d3-4168-b49b-de4993af8cc9';
  private baseUrl: string = 'http://localhost:8000';
  private eventSource: EventSource | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;

  private onTranscriptCallback: ((text: string) => void) | null = null;
  private onAIResponseCallback: ((text: string) => void) | null = null;
  private onAudioCallback: ((data: ArrayBuffer) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private onSpeakingCallback: ((isSpeaking: boolean) => void) | null = null;

  async connect(): Promise<string> {
    // this.userId = `user_${Date.now()}`;
    this.userId = `38db6a01-b3d3-4168-b49b-de4993af8cc9`;
    console.log('[Stream] Connecting with userId:', this.userId);

    this.audioContext = new AudioContext({ sampleRate: 16000 });

    this.eventSource = new EventSource(`${this.baseUrl}/api/v1/stream/events/${this.userId}`);

    this.eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Stream] Received message:', message.type);

        switch (message.type) {
          case 'transcript':
            this.onTranscriptCallback?.(message.text);
            break;
          case 'ai-response':
            this.onAIResponseCallback?.(message.text);
            break;
          case 'audio':
            const audioData = this.base64ToArrayBuffer(message.data);
            this.onAudioCallback?.(audioData);
            break;
          case 'error':
            this.onErrorCallback?.(message.error);
            break;
        }
      } catch (error) {
        console.error('[Stream] Error parsing message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('[Stream] EventSource error:', error);
      this.onErrorCallback?.(error);
    };

    return this.userId;
  }

  async startRecording(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      console.log('[Stream] Media stream obtained');

      if (!this.audioContext) {
        this.audioContext = new AudioContext({ sampleRate: 16000 });
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      let silenceStart = Date.now();
      let isSpeaking = false;
      const SILENCE_THRESHOLD = 0.01;
      const SILENCE_DURATION = 300;
      const SEND_INTERVAL = 100;
      let lastSendTime = 0;

      this.audioProcessor.onaudioprocess = async (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);

        if (rms > SILENCE_THRESHOLD) {
          if (!isSpeaking) {
            isSpeaking = true;
            this.onSpeakingCallback?.(true);
            console.log('[VAD] Speech detected');
          }
          silenceStart = Date.now();

          const now = Date.now();
          if (now - lastSendTime >= SEND_INTERVAL) {
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
            }

            await this.sendAudioData(pcmData.buffer);
            lastSendTime = now;
          }
        } else {
          if (isSpeaking && Date.now() - silenceStart > SILENCE_DURATION) {
            isSpeaking = false;
            this.onSpeakingCallback?.(false);
            console.log('[VAD] Speech ended');
          }
        }
      };

      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);

      console.log('[Stream] Recording started with VAD');
    } catch (error) {
      console.error('[Stream] Error starting recording:', error);
      throw error;
    }
  }

  private async sendAudioData(audioData: ArrayBuffer): Promise<void> {
    try {
      const base64Audio = this.arrayBufferToBase64(audioData);

      await fetch(`${this.baseUrl}/api/v1/stream/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          audioData: base64Audio,
        }),
      });
    } catch (error) {
      console.error('[Stream] Error sending audio:', error);
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  stopRecording(): void {
    console.log('[Stream] Stopping recording');

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }
  }

  async disconnect(): Promise<void> {
    console.log('[Stream] Disconnecting');

    this.stopRecording();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    debugger
this.userId = '38db6a01-b3d3-4168-b49b-de4993af8cc9';
    if (this.userId) {
      try {
        await fetch(`${this.baseUrl}/api/v1/stream/end-call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId }),
        });
      } catch (error) {
        console.error('[Stream] Error ending call:', error);
      }
    }
  }

  onTranscript(callback: (text: string) => void): void {
    this.onTranscriptCallback = callback;
  }

  onAIResponse(callback: (text: string) => void): void {
    this.onAIResponseCallback = callback;
  }

  onAudio(callback: (data: ArrayBuffer) => void): void {
    this.onAudioCallback = callback;
  }

  onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback;
  }

  onSpeaking(callback: (isSpeaking: boolean) => void): void {
    this.onSpeakingCallback = callback;
  }
}

export default new StreamService();
