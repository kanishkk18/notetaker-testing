'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { JoinMeetingForm } from '../../components/JoinMeetingForm';
import { MeetingCard } from '../../components/MeetingCard';
import { Button } from '../../components/ui/button';
import { MeetingData } from '../../types';
import { LogOut, Plus } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchMeetings();
    }
  }, [status, router]);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Meeting Notetaker</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{session?.user?.email}</span>
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">Your Meetings</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Meeting
          </Button>
        </div>

        {showForm && (
          <div className="mb-8">
            <JoinMeetingForm 
              onSuccess={() => {
                setShowForm(false);
                fetchMeetings();
              }} 
            />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <MeetingCard 
              key={meeting.id} 
              meeting={meeting} 
              onUpdate={fetchMeetings}
            />
          ))}
        </div>

        {meetings.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No meetings yet</p>
            <p>Click "New Meeting" to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}