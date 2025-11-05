import { useVoiceCall } from '../hooks/useVoiceCall';
import { VoiceVisualizer } from './VoiceVisualizer';

export const VoiceCall = () => {
  const {
    isConnected,
    isRecording,
    isSpeaking,
    transcript,
    aiResponse,
    connect,
    startRecording,
    stopRecording,
    disconnect,
  } = useVoiceCall();

  const handleStartCall = async () => {
    await connect();
    setTimeout(() => {
      startRecording();
    }, 500);
  };

  const handleEndCall = () => {
    stopRecording();
    disconnect();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>AI Voice Assistant</h1>

        <div style={styles.visualizerContainer}>
          <VoiceVisualizer isActive={isRecording || isSpeaking} />
        </div>

        <div style={styles.statusContainer}>
          {!isConnected && (
            <p style={styles.statusText}>Ready to connect</p>
          )}
          {isConnected && !isRecording && !isSpeaking && (
            <p style={styles.statusText}>Connected - Listening...</p>
          )}
          {isRecording && !isSpeaking && (
            <p style={{ ...styles.statusText, color: '#ef4444' }}>Recording...</p>
          )}
          {isSpeaking && (
            <p style={{ ...styles.statusText, color: '#3b82f6' }}>AI Speaking...</p>
          )}
        </div>

        <div style={styles.buttonContainer}>
          {!isConnected ? (
            <button style={styles.startButton} onClick={handleStartCall}>
              Start Call
            </button>
          ) : (
            <button style={styles.endButton} onClick={handleEndCall}>
              End Call
            </button>
          )}
        </div>

        {transcript && (
          <div style={styles.transcriptBox}>
            <p style={styles.label}>You said:</p>
            <p style={styles.text}>{transcript}</p>
          </div>
        )}

        {aiResponse && (
          <div style={styles.responseBox}>
            <p style={styles.label}>AI Response:</p>
            <p style={styles.text}>{aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '48px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    textAlign: 'center' as const,
    marginBottom: '32px',
    color: '#1f2937',
  },
  visualizerContainer: {
    marginBottom: '32px',
  },
  statusContainer: {
    textAlign: 'center' as const,
    marginBottom: '24px',
    minHeight: '28px',
  },
  statusText: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#10b981',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  startButton: {
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    padding: '16px 48px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  endButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    padding: '16px 48px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  transcriptBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  responseBox: {
    backgroundColor: '#dbeafe',
    borderRadius: '12px',
    padding: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
  },
  text: {
    fontSize: '16px',
    color: '#1f2937',
    lineHeight: '1.5',
  },
};
