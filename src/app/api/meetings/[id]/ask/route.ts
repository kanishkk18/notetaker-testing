import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import { askAboutMeeting } from '../../../../../lib/openai';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        chatMessages: {
          orderBy: { createdAt: 'asc' },
          take: 10, // Last 10 messages for context
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (!meeting.transcript || !meeting.summary) {
      return NextResponse.json(
        { error: 'Meeting transcription or summary not available yet' },
        { status: 400 }
      );
    }

    // Format transcript for AI
    const transcriptText = (meeting.transcript as any[])
      .map((segment) => `${segment.speaker}: ${segment.words?.map((w: any) => w.word).join(' ') || segment.text}`)
      .join('\n');

    // Get AI response
    const answer = await askAboutMeeting(
      question,
      transcriptText,
      meeting.summary,
      meeting.chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))
    );

    // Save chat messages
    await prisma.chatMessage.createMany({
      data: [
        {
          meetingId: params.id,
          role: 'user',
          content: question,
        },
        {
          meetingId: params.id,
          role: 'assistant',
          content: answer,
        },
      ],
    });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}