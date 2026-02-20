// import { NextRequest, NextResponse } from 'next/server';
// import { createHmac } from 'crypto';
// import { prisma } from '@/lib/prisma';
// import { generateSummary } from '@/lib/openai';
// import { WebhookPayload } from '@/types';

// const WEBHOOK_SECRET = process.env.MEETING_BAAS_WEBHOOK_SECRET;

// function verifySignature(payload: string, signature: string): boolean {
//   if (!WEBHOOK_SECRET) return true; // Skip verification if no secret set
  
//   const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
//     .update(payload)
//     .digest('hex');
  
//   try {
//     return createHmac('sha256', WEBHOOK_SECRET)
//       .update(payload)
//       .digest('hex') === signature;
//   } catch {
//     return false;
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const payload = await req.text();
//     const signature = req.headers.get('x-meetingbaas-signature') || '';
    
//     // Verify webhook signature
//     if (!verifySignature(payload, signature)) {
//       return NextResponse.json(
//         { error: 'Invalid signature' },
//         { status: 401 }
//       );
//     }

//     const event: WebhookPayload = JSON.parse(payload);
//     const { bot_id: botId } = event.data;

// if (!botId) {
//   return NextResponse.json(
//     { error: 'bot_id missing in webhook payload' },
//     { status: 400 }
//   );
// }

// const meeting = await prisma.meeting.findUnique({
//   where: { botId },
// });


//     if (!meeting) {
//       return NextResponse.json(
//         { error: 'Meeting not found' },
//         { status: 404 }
//       );
//     }

//     switch (event.event) {
//       case 'meeting.started':
//         await prisma.meeting.update({
//           where: { id: meeting.id },
//           data: {
//             status: 'RECORDING',
//             startedAt: new Date(),
//           },
//         });
//         break;

//       case 'complete':
//         const transcript = event.data.transcript || [];
//         const speakers = event.data.speakers || [];
//         const videoUrl = event.data.mp4;

//         // Generate transcript text for summary
//         const transcriptText = transcript
//           .map((segment) => {
//             const text = segment.words?.map(w => w.word).join(' ') || '';
//             return `${segment.speaker}: ${text}`;
//           })
//           .join('\n');

//         // Generate AI summary
//         let summary = '';
//         try {
//           summary = await generateSummary(transcriptText);
//         } catch (error) {
//           console.error('Error generating summary:', error);
//           summary = 'Summary generation failed. Please check the transcript.';
//         }

//         await prisma.meeting.update({
//           where: { id: meeting.id },
//           data: {
//             status: 'COMPLETED',
//             endedAt: new Date(),
//             transcript: transcript as any,
//             speakers,
//             videoUrl,
//             summary,
//           },
//         });
//         break;

//       case 'failed':
//         await prisma.meeting.update({
//           where: { id: meeting.id },
//           data: {
//             status: 'FAILED',
//             summary: `Meeting failed: ${event.data.message || event.data.error}`,
//           },
//         });
//         break;

//       case 'transcription_complete':
//         // Handle partial transcription updates if needed
//         break;
//     }

//     return NextResponse.json({ status: 'success' });
//   } catch (error) {
//     console.error('Webhook error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSummary } from '@/lib/openai';

// Skip signature verification for now (webhook.cool doesn't sign)
// In production, add MEETING_BAAS_WEBHOOK_SECRET verification

export async function POST(req: NextRequest) {
  try {
    // Get the raw body
    const rawBody = await req.text();
    console.log('Webhook received:', rawBody.substring(0, 500));

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    console.log('Event type:', event);
    console.log('Bot ID:', data?.bot_id);

    // Handle meeting completion
    if (event === 'complete' || event === 'meeting.completed') {
      await handleMeetingComplete(data);
    }

    return NextResponse.json({ status: 'success' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handleMeetingComplete(data: any) {
  const { 
    bot_id, 
    transcript, 
    speakers, 
    mp4, 
    audio,
    extra 
  } = data;

  console.log('Processing completed meeting:', bot_id);
  console.log('Meeting ID from extra:', extra?.meetingId);

  // Find the meeting in your database
  const meeting = await prisma.meeting.findFirst({
    where: { 
      botId: bot_id 
    },
  });

  if (!meeting) {
    console.error('Meeting not found for bot:', bot_id);
    return;
  }

  // Build transcript text for summary
  const transcriptText = transcript
    ?.map((segment: any) => {
      const text = segment.words?.length > 0 
        ? segment.words.map((w: any) => w.word).join(' ')
        : `Speaker: ${segment.speaker} (offset: ${segment.offset}s)`;
      return `${segment.speaker}: ${text}`;
    })
    .join('\n\n') || '';

  console.log('Transcript text length:', transcriptText.length);

  // Generate AI summary
  let summary = '';
  if (transcriptText.length > 50) {
    try {
      console.log('Generating summary...');
      summary = await generateSummary(transcriptText);
      console.log('Summary generated');
    } catch (e) {
      console.error('Summary generation failed:', e);
      summary = 'Summary generation failed. Please check the transcript.';
    }
  } else {
    summary = 'Transcript too short for summary.';
  }

  // Update meeting with all data
  const updatedMeeting = await prisma.meeting.update({
    where: { id: meeting.id },
    data: {
      status: 'COMPLETED',
      videoUrl: mp4,
      audioUrl: audio,
      transcript: transcript || [],
      speakers: speakers || [],
      summary: summary,
      endedAt: new Date(),
    },
  });

  console.log('Meeting updated successfully:', updatedMeeting.id);
  console.log('Video URL:', mp4 ? 'Yes' : 'No');
  console.log('Audio URL:', audio ? 'Yes' : 'No');
  console.log('Transcript segments:', transcript?.length || 0);
}