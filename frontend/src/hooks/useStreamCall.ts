import { useState, useRef, useEffect } from 'react';
import streamService from '../service/stream.service';

export const useStreamCall = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');

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
          const audioBuffer = await audioContextRef.current.decodeAudioData(
            audioData.slice(0)
          );
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
      console.log('[Hook] Connecting to stream service');

      const userId = await streamService.connect();
      console.log('[Hook] Connected with userId:', userId);

      streamService.onTranscript((text) => {
        console.log('[Hook] Transcript received:', text);
        setTranscript(text);
      });

      streamService.onAIResponse((text) => {
        console.log('[Hook] AI response received:', text);
        setAiResponse(text);
      });

      streamService.onAudio((data) => {
        console.log('[Hook] Audio received:', data.byteLength, 'bytes');
        audioQueueRef.current.push(data);
        playAudioQueue();
      });

      streamService.onSpeaking((speaking) => {
        console.log('[Hook] Speaking status:', speaking);
        if (speaking) {
          setIsRecording(true);
        }
      });

      streamService.onError((error) => {
        console.error('[Hook] Error:', error);
      });

      audioContextRef.current = new AudioContext();
      setIsConnected(true);
    } catch (error) {
      console.error('[Hook] Connection error:', error);
    }
  };

  const startRecording = async () => {
    try {
      console.log('[Hook] Starting recording');
      await streamService.startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error('[Hook] Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    console.log('[Hook] Stopping recording');
    streamService.stopRecording();
    setIsRecording(false);
  };

  const disconnect = async () => {
    console.log('[Hook] Disconnecting');
    stopRecording();
    await streamService.disconnect();
    setIsConnected(false);

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
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
