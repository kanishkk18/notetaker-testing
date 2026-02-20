import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMeetingData } from '@/lib/baas';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Fetch latest data from BaaS API
    const result = await getMeetingData(meeting.botId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to fetch from BaaS', details: result.error },
        { status: 500 }
      );
    }

    // Update local record with latest data
    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        transcript: result.data.transcript || meeting.transcript,
        speakers: result.data.speakers || meeting.speakers,
        videoUrl: result.data.mp4 || meeting.videoUrl,
        duration: result.data.duration || meeting.duration,
        status: result.data.mp4 ? 'COMPLETED' : meeting.status,
      },
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}