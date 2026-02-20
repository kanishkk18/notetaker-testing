import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      include: {
        chatMessages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}