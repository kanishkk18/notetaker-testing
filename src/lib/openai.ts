import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummary(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a professional meeting summarizer. Create a concise but comprehensive summary of the meeting transcript. Include key points, decisions made, action items, and important discussions.',
      },
      {
        role: 'user',
        content: `Please summarize this meeting transcript:\n\n${transcript}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content || 'No summary generated';
}

export async function askAboutMeeting(
  question: string,
  transcript: string,
  summary: string,
  chatHistory: { role: string; content: string }[]
): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are an AI assistant that answers questions about a specific meeting. 
Use the meeting transcript and summary to provide accurate, helpful answers.
If the answer isn't in the meeting content, say so honestly.

Meeting Summary:
${summary}

Meeting Transcript:
${transcript}`,
    },
    ...chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user',
      content: question,
    },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0].message.content || 'I could not generate a response';
}