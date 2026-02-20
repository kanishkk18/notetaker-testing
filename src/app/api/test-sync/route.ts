import { NextResponse } from 'next/server';
import { getMeetingData } from '@/lib/baas';

export async function GET() {
  // Replace with your actual bot ID from the meeting
  const botId = 'a673d4ab-c7c9-4583-a842-a31493632714';
  
  console.log('Testing sync for bot:', botId);
  
  const result = await getMeetingData(botId);
  
  return NextResponse.json({
    success: result.success,
    error: result.error,
    data: result.data ? {
      status: result.data.status,
      event: result.data.event,
      hasMp4: !!result.data.mp4,
      hasTranscript: !!result.data.transcript,
      transcriptLength: result.data.transcript?.length,
      speakers: result.data.speakers,
    } : null
  });
}