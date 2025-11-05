import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(url: string = 'http://localhost:3001') {
    this.socket = io(url, {
      transports: ['websocket'],
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  sendAudioData(data: ArrayBuffer) {
    if (this.socket) {
      this.socket.emit('audio-data', data);
    }
  }

  stopSpeaking() {
    if (this.socket) {
      this.socket.emit('stop-speaking');
    }
  }

  onTranscript(callback: (data: { text: string }) => void) {
    if (this.socket) {
      this.socket.on('transcript', callback);
    }
  }

  onAIResponse(callback: (data: { text: string }) => void) {
    if (this.socket) {
      this.socket.on('ai-response', callback);
    }
  }

  onAudio(callback: (data: ArrayBuffer) => void) {
    if (this.socket) {
      this.socket.on('audio', callback);
    }
  }

  onError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  onStopAudio(callback: () => void) {
    if (this.socket) {
      this.socket.on('stop-audio', callback);
    }
  }
}

export default new SocketService();
