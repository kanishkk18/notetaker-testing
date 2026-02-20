'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';

interface JoinMeetingFormProps {
  onSuccess: () => void;
}

export function JoinMeetingForm({ onSuccess }: JoinMeetingFormProps) {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingName, setMeetingName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingUrl, meetingName }),
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Bot is joining the meeting...',
        });
        onSuccess();
      } else {
        const error = await res.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to join meeting',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <div>
        <Label htmlFor="meetingUrl">Meeting URL</Label>
        <Input
          id="meetingUrl"
          placeholder="https://meet.google.com/... or Zoom link"
          value={meetingUrl}
          onChange={(e) => setMeetingUrl(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Supports Google Meet, Zoom, and Microsoft Teams
        </p>
      </div>

      <div>
        <Label htmlFor="meetingName">Meeting Name (Optional)</Label>
        <Input
          id="meetingName"
          placeholder="e.g., Weekly Team Standup"
          value={meetingName}
          onChange={(e) => setMeetingName(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Joining...' : 'Send AI Notetaker'}
      </Button>
    </form>
  );
}