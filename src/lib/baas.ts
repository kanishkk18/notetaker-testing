// const API_KEY = process.env.MEETING_BAAS_API_KEY?.trim();
// const GLADIA_API_KEY = process.env.GLADIA_API_KEY?.trim(); // Add this
// const BASE_URL = 'https://api.meetingbaas.com';

// if (!API_KEY) {
//   console.error('ERROR: MEETING_BAAS_API_KEY is not defined');
// }

// export async function joinMeeting(params: {
//   meetingUrl: string;
//   botName?: string;
//   webhookUrl?: string;
//   extra?: Record<string, any>;
// }) {
//   try {
//     const { meetingUrl, botName = 'AI Notetaker', webhookUrl, extra } = params;

//     const cleanMeetingUrl = meetingUrl.trim();
//     const cleanWebhookUrl = webhookUrl?.trim();

//     console.log('Calling Meeting BaaS API...');

//     const requestBody: any = {
//       meeting_url: cleanMeetingUrl,
//       bot_name: botName,
//       reserved: false,
//       recording_mode: 'speaker_view',
//       webhook_url: cleanWebhookUrl,
//       extra: extra || {},
//       automatic_leave: {
//         waiting_room_timeout: 600,
//         no_one_joined_timeout: 600,
//         everyone_left_timeout: 60,
//       },
//     };

//     // Only add speech_to_text if we have the Gladia API key
//     // Otherwise, let Meeting BaaS use default transcription
//     if (GLADIA_API_KEY) {
//       requestBody.speech_to_text = {
//         provider: 'Gladia',
//         api_key: GLADIA_API_KEY, // Required for Gladia
//       };
//     }

//     console.log('Request body:', JSON.stringify(requestBody, null, 2));

//     const response = await fetch(`${BASE_URL}/bots`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'x-meeting-baas-api-key': API_KEY || '',
//       },
//       body: JSON.stringify(requestBody),
//     });

//     const data = await response.json();
//     console.log('Meeting BaaS response status:', response.status);

//     if (!response.ok) {
//       console.error('Meeting BaaS error:', data);
//       return {
//         success: false,
//         error: data.description || data.error || `HTTP ${response.status}`,
//         data: null,
//       };
//     }

//     return {
//       success: true,
//       data: { bot_id: data.bot_id },
//     };
//   } catch (error) {
//     console.error('BaaS error:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Network error',
//       data: null,
//     };
//   }
// }

// export async function leaveMeeting(botId: string) {
//   const response = await fetch(`${BASE_URL}/bots/${botId}/leave`, {
//     method: 'POST',
//     headers: { 'x-meeting-baas-api-key': API_KEY || '' },
//   });
//   return response.json();
// }

// export async function getMeetingData(botId: string) {
//   const response = await fetch(`${BASE_URL}/bots/${botId}?include_transcripts=true`, {
//     headers: { 'x-meeting-baas-api-key': API_KEY || '' },
//   });
//   return response.json();
// }

const API_KEY = process.env.MEETING_BAAS_API_KEY?.trim();
const BASE_URL = 'https://api.meetingbaas.com';

if (!API_KEY) {
  console.error('ERROR: MEETING_BAAS_API_KEY is not defined');
}

export async function joinMeeting(params: {
  meetingUrl: string;
  botName?: string;
  webhookUrl?: string;
  extra?: Record<string, any>;
}) {
  try {
    const { meetingUrl, botName = 'AI Notetaker', webhookUrl, extra } = params;

    const cleanMeetingUrl = meetingUrl.trim();
    const cleanWebhookUrl = webhookUrl?.trim();

    console.log('Calling Meeting BaaS API...');

    const requestBody: any = {
      meeting_url: cleanMeetingUrl,
      bot_name: botName,
      reserved: false,
      recording_mode: 'speaker_view',
      webhook_url: cleanWebhookUrl,
      extra: extra || {},
      automatic_leave: {
        waiting_room_timeout: 600,
        no_one_joined_timeout: 600,
        everyone_left_timeout: 60,
      },
    };

    const response = await fetch(`${BASE_URL}/bots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-meeting-baas-api-key': API_KEY || '',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('Meeting BaaS response status:', response.status);

    if (!response.ok) {
      console.error('Meeting BaaS error:', data);
      return {
        success: false,
        error: data.description || data.error || `HTTP ${response.status}`,
        data: null,
      };
    }

    return {
      success: true,
      data: { bot_id: data.bot_id },
    };
  } catch (error) {
    console.error('BaaS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      data: null,
    };
  }
}

export async function leaveMeeting(botId: string) {
  try {
    const response = await fetch(`${BASE_URL}/bots/${botId}/leave`, {
      method: 'POST',
      headers: { 'x-meeting-baas-api-key': API_KEY || '' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to leave' };
    }
    
    return { success: true, data: await response.json() };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

export async function getMeetingData(botId: string) {
  try {
    console.log('Fetching meeting data for bot:', botId);
    
    const response = await fetch(`${BASE_URL}/bots/${botId}?include_transcripts=true`, {
      headers: { 'x-meeting-baas-api-key': API_KEY || '' },
    });

    console.log('Get meeting data response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch meeting data:', errorData);
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
        data: null,
      };
    }

    const data = await response.json();
    console.log('Meeting data received:', {
      hasTranscript: !!data.transcript,
      hasMp4: !!data.mp4,
      status: data.status,
    });

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Get meeting data error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      data: null,
    };
  }
}