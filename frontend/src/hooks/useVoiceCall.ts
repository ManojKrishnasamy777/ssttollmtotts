import { useState, useRef, useEffect } from 'react';
import socketService from '../services/socket.service';

export const useVoiceCall = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      if (audioData && audioContextRef.current) {
        try {
          const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.slice(0));
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);

          await new Promise<void>((resolve) => {
            source.onended = () => resolve();
            source.start();
          });
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
  };

  const connect = async () => {
    try {
      const socket = socketService.connect();

      socket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      socketService.onTranscript((data) => {
        setTranscript(data.text);
      });

      socketService.onAIResponse((data) => {
        setAiResponse(data.text);
      });

      socketService.onAudio((data) => {
        audioQueueRef.current.push(data);
        playAudioQueue();
      });

      socketService.onStopAudio(() => {
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setIsSpeaking(false);
      });

      socketService.onError((error) => {
        console.error('Socket error:', error);
      });

      audioContextRef.current = new AudioContext();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then((buffer) => {
            socketService.sendAudioData(buffer);
          });
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const disconnect = () => {
    stopRecording();
    socketService.disconnect();
    setIsConnected(false);
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isRecording,
    isSpeaking,
    transcript,
    aiResponse,
    connect,
    startRecording,
    stopRecording,
    disconnect,
  };
};
