import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../lib/auth';
import { Button } from '../components/ui/button';
import { SignInButton } from '../components/SignInButton';
import { Mic, FileText, Bot, Video } from 'lucide-react';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            AI Meeting Notetaker
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Automatically join, record, transcribe, and summarize your meetings.
            Ask AI anything about what was discussed.
          </p>
          
          <div className="flex justify-center gap-4 mb-16">
            <SignInButton />
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <FeatureCard
              icon={<Bot className="w-8 h-8 text-blue-600" />}
              title="Auto-Join Bot"
              description="Deploy AI bots to join Zoom, Google Meet, or Teams meetings automatically"
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8 text-green-600" />}
              title="Smart Transcription"
              description="Accurate speaker diarization with per-person transcripts"
            />
            <FeatureCard
              icon={<Video className="w-8 h-8 text-purple-600" />}
              title="Video & Audio"
              description="Full meeting recordings with synchronized playback"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}