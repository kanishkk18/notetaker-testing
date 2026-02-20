'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { VideoPlayer } from '../../../components/VideoPlayer';
import { TranscriptView } from '../../../components/TranscriptView';
import { ChatInterface } from '../../../components/ChatInterface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { MeetingData, ChatMessage } from '../../../types';

export default function MeetingDetail() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [meeting, setMeeting] = useState<(MeetingData & { chatMessages: ChatMessage[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
      }
    } catch (error) {
      console.error('Error fetching meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTranscript = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/meetings/${id}/transcript`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      console.error('Error refreshing transcript:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    
    fetchMeeting();
    
    // Poll every 10 seconds if meeting is active
    const interval = setInterval(() => {
      if (meeting && ['JOINING', 'JOINED', 'RECORDING'].includes(meeting.status)) {
        // Try to sync with BaaS
        fetch(`/api/meetings/${id}/sync`, { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.status === 'COMPLETED') {
              fetchMeeting(); // Refresh the page data
            }
          })
          .catch(console.error);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [session, id, meeting?.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Meeting not found</h1>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{meeting.meetingName || 'Untitled Meeting'}</h1>
                <p className="text-sm text-gray-500">
                  Status: <span className="font-medium">{meeting.status}</span>
                </p>
              </div>
            </div>
            {/* <Button
              variant="outline"
              onClick={refreshTranscript}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button> */}
            <Button
  variant="outline"
  onClick={async () => {
    // Manually call the webhook handler with the data
    const res = await fetch(`/api/meetings/${id}/sync`, { method: 'POST' });
    if (res.ok) {
      fetchMeeting(); // Refresh data
    }
  }}
>
  <RefreshCw className="w-4 h-4 mr-2" />
  Sync with Meeting BaaS
</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="video" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4">
            <VideoPlayer 
              videoUrl={meeting.videoUrl} 
              status={meeting.status}
            />
          </TabsContent>

          <TabsContent value="transcript">
            <TranscriptView 
              transcript={meeting.transcript || []} 
              speakers={meeting.speakers || []}
            />
          </TabsContent>

          <TabsContent value="summary">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Meeting Summary</h2>
              {meeting.summary ? (
                <div className="prose max-w-none">
                  {meeting.summary.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  {meeting.status === 'COMPLETED' 
                    ? 'Summary generation in progress...'
                    : 'Summary will be available after the meeting is completed.'}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <ChatInterface 
              meetingId={meeting.id}
              initialMessages={meeting.chatMessages || []}
              transcript={meeting.transcript || []}
              summary={meeting.summary}
              disabled={!meeting.summary}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}