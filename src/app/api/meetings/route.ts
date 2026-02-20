import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { joinMeeting } from '@/lib/baas';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetings = await prisma.meeting.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { chatMessages: true } },
      },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/meetings called');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { meetingUrl, meetingName } = body;

    // Trim all inputs to remove trailing spaces
    meetingUrl = meetingUrl?.trim();
    meetingName = meetingName?.trim();

    console.log('Cleaned meetingUrl:', meetingUrl);

    if (!meetingUrl) {
      return NextResponse.json({ error: 'Meeting URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(meetingUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid meeting URL format' }, { status: 400 });
    }

    // Create meeting with temp botId
    const meeting = await prisma.meeting.create({
      data: {
        userId: session.user.id,
        botId: `temp-${uuidv4()}`,
        meetingUrl,
        meetingName: meetingName || 'Untitled Meeting',
        status: 'JOINING',
      },
    });

    console.log('Meeting created:', meeting.id);

    // Build webhook URL - ensure no trailing spaces
    const appUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim();
    const webhookUrl = `https://conferio-notetaker.vercel.app/api/baas/webhook`;
    
    console.log('Calling BaaS with:');
    console.log('- meetingUrl:', meetingUrl);
    console.log('- webhookUrl:', webhookUrl);
    console.log('- API Key exists:', !!process.env.MEETING_BAAS_API_KEY);

    const result = await joinMeeting({
      meetingUrl,
      botName: 'AI Notetaker',
      // webhookUrl: undefined, // <-- No webhook
      extra: { meetingId: meeting.id },
    });

    console.log('BaaS result:', result);

    if (!result.success || !result.data?.bot_id) {
      // Update status to failed
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: 'FAILED' },
      });
      
      return NextResponse.json(
        { error: 'Failed to join meeting', details: result.error },
        { status: 500 }
      );
    }

    // Update with real bot ID
    const updatedMeeting = await prisma.meeting.update({
      where: { id: meeting.id },
      data: { botId: result.data.bot_id },
    });

    return NextResponse.json(updatedMeeting);
    
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}