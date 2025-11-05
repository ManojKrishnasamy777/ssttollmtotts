# AI Voice Assistant Setup Guide

## Prerequisites

1. **PostgreSQL Database**
   - Install PostgreSQL on your system
   - Create a database named `voice_assistant`
   - Update credentials in `backend/.env` if needed

2. **API Keys**
   You need to obtain API keys from:
   - **Deepgram**: https://deepgram.com (for Speech-to-Text)
   - **OpenAI**: https://platform.openai.com (for LLM)
   - **ElevenLabs**: https://elevenlabs.io (for Text-to-Speech)

## Installation

1. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

2. **Configure Environment Variables**

   Edit `backend/.env` and add your API keys:
   ```
   DEEPGRAM_API_KEY=your_deepgram_api_key
   OPENAI_API_KEY=your_openai_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
   ```

   Update database credentials if needed:
   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres
   DATABASE_NAME=voice_assistant
   ```

## Running the Application

1. **Start PostgreSQL** (if not already running)

2. **Run both backend and frontend**
   ```bash
   npm run dev
   ```

   Or run separately:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run start:dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## How It Works

1. Click "Start Call" to connect
2. Allow microphone access when prompted
3. Start speaking - your voice is transcribed in real-time
4. The AI responds with text and voice
5. Watch the animated visualizer during recording and AI speech
6. Click "End Call" to disconnect

## Architecture

- **Backend (NestJS)**
  - WebSocket gateway for real-time communication
  - Deepgram integration for speech-to-text
  - OpenAI integration for AI responses
  - ElevenLabs integration for text-to-speech
  - PostgreSQL for conversation storage

- **Frontend (React + Vite)**
  - Real-time audio capture and streaming
  - Socket.io client for WebSocket communication
  - Animated voice visualizer
  - Audio playback queue management

## Troubleshooting

- **Microphone not working**: Check browser permissions
- **Connection issues**: Ensure backend is running on port 3001
- **Database errors**: Verify PostgreSQL is running and credentials are correct
- **API errors**: Verify all API keys are valid and have sufficient credits
