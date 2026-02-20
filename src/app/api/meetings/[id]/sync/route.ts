import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMeetingData } from '@/lib/baas';
import { generateSummary } from '@/lib/openai';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Sync called for meeting:', params.id);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!meeting) {
      console.log('Meeting not found:', params.id);
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    console.log('Found meeting:', meeting.id, 'Bot ID:', meeting.botId, 'Status:', meeting.status);

    // Don't sync if already completed or failed
    if (meeting.status === 'COMPLETED' || meeting.status === 'FAILED') {
      console.log('Meeting already in final state:', meeting.status);
      return NextResponse.json(meeting);
    }

    // Fetch latest data from Meeting BaaS
    console.log('Fetching from BaaS for bot:', meeting.botId);
    const result = await getMeetingData(meeting.botId);
    
    console.log('BaaS result:', {
      success: result.success,
      hasData: !!result.data,
      error: result.error,
    });

    if (!result.success) {
      console.error('Failed to fetch from BaaS:', result.error);
      
      // If bot not found, mark as failed
      if (result.error?.includes('not found') || result.error?.includes('404')) {
        await prisma.meeting.update({
          where: { id: params.id },
          data: { 
            status: 'FAILED',
            summary: `Bot not found: ${result.error}`
          },
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch from BaaS', details: result.error },
        { status: 500 }
      );
    }

    const data = result.data;
    console.log('BaaS data received:', {
      status: data.status,
      event: data.event,
      hasMp4: !!data.mp4,
      hasTranscript: !!data.transcript,
      transcriptLength: data.transcript?.length,
    });

    // Check if meeting has completed
    const isCompleted = data.status === 'complete' || 
                       data.event === 'complete' || 
                       !!data.mp4 ||
                       (data.transcript && data.transcript.length > 0);

    if (isCompleted) {
      console.log('Meeting completed, processing...');

      // Generate transcript text for summary
      const transcriptText = data.transcript
        ?.map((segment: any) => {
          const text = segment.words?.map((w: any) => w.word).join(' ') || segment.text || '';
          return `${segment.speaker}: ${text}`;
        })
        .join('\n') || '';

      console.log('Transcript text length:', transcriptText.length);

      // Generate summary if we have transcript and no existing summary
      let summary = meeting.summary;
      if (transcriptText && transcriptText.length > 50 && !summary) {
        try {
          console.log('Generating summary...');
          summary = await generateSummary(transcriptText);
          console.log('Summary generated successfully');
        } catch (e) {
          console.error('Summary generation failed:', e);
          summary = 'Summary generation failed. Please check the transcript.';
        }
      }

      // Update meeting in database
      const updatedMeeting = await prisma.meeting.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
          videoUrl: data.mp4 || data.video_url || meeting.videoUrl,
          transcript: data.transcript || [],
          speakers: data.speakers || [],
          duration: data.duration,
          summary: summary || `Meeting completed. Duration: ${data.duration || 'unknown'}s`,
          endedAt: new Date(),
        },
      });

      console.log('Meeting updated to COMPLETED');
      return NextResponse.json(updatedMeeting);
    }

    // Meeting still in progress - update status if changed
    const newStatus = data.status || meeting.status;
    if (newStatus !== meeting.status) {
      await prisma.meeting.update({
        where: { id: params.id },
        data: { status: newStatus.toUpperCase() },
      });
    }
    
    console.log('Meeting still in progress, status:', newStatus);
    
    return NextResponse.json({
      status: newStatus,
      message: 'Meeting still in progress',
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
}