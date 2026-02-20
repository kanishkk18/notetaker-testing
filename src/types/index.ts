export interface TranscriptSegment {
    speaker: string;
    offset: number;
    words: {
      start: number;
      end: number;
      word: string;
    }[];
    text?: string;
  }
  
  // export interface MeetingData {
  //   id: string;
  //   botId: string;
  //   meetingUrl: string;
  //   meetingName?: string;
  //   status: string;
  //   videoUrl?: string;
  //   transcript?: TranscriptSegment[];
  //   speakers: string[];
  //   summary?: string;
  //   startedAt?: string;
  //   endedAt?: string;
  //   duration?: number;
  //   createdAt: string;
  // }

  export interface MeetingData {
    id: string;
    botId: string;
    meetingUrl: string;
    meetingName?: string;
    status: string;
    videoUrl?: string;
    transcript?: TranscriptSegment[];
    speakers: string[];
    summary?: string;
    startedAt?: string;
    endedAt?: string;
    duration?: number;
    createdAt: string;
    _count?: {
      chatMessages: number;
    };
  }
  
  export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }
  
  export interface WebhookPayload {
    event: 'complete' | 'failed' | 'transcription_complete' | 'meeting.started';
    data: {
      bot_id: string;
      transcript?: TranscriptSegment[];
      speakers?: string[];
      mp4?: string;
      error?: string;
      message?: string;
    };
  }