'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { MeetingData } from '../types';
import { 
  Video, 
  FileText, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../components/ui/use-toast';

interface MeetingCardProps {
  meeting: MeetingData;
  onUpdate: () => void;
}

const statusColors: Record<string, string> = {
  JOINING: 'bg-yellow-100 text-yellow-800',
  JOINED: 'bg-blue-100 text-blue-800',
  RECORDING: 'bg-red-100 text-red-800 animate-pulse',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-gray-100 text-gray-800',
  LEFT: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  JOINING: <Loader2 className="w-4 h-4 animate-spin" />,
  JOINED: <Clock className="w-4 h-4" />,
  RECORDING: <Video className="w-4 h-4" />,
  COMPLETED: <CheckCircle className="w-4 h-4" />,
  FAILED: <XCircle className="w-4 h-4" />,
  LEFT: <Clock className="w-4 h-4" />,
};

export function MeetingCard({ meeting, onUpdate }: MeetingCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        toast({ title: 'Meeting deleted' });
        onUpdate();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete meeting',
        variant: 'destructive' 
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/meetings/${meeting.id}`)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold line-clamp-1">
          {meeting.meetingName || 'Untitled Meeting'}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <Badge className={statusColors[meeting.status] || 'bg-gray-100'}>
            <span className="flex items-center gap-1">
              {statusIcons[meeting.status]}
              {meeting.status}
            </span>
          </Badge>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(meeting.createdAt), { addSuffix: true })}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Video className="w-4 h-4" />
            <span>
              {meeting.duration 
                ? `${Math.floor(meeting.duration / 60)}m ${meeting.duration % 60}s`
                : 'In progress...'}
            </span>
          </div>
          
          {meeting.speakers && meeting.speakers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{meeting.speakers.length} speakers</span>
            </div>
          )}

          {/* {meeting._count?.chatMessages > 0 && (
            <div className="text-sm text-blue-600">
              {meeting._count.chatMessages} AI chat messages
            </div>
          )} */}

{(meeting as any)._count?.chatMessages > 0 && (
  <div className="text-sm text-blue-600">
    {(meeting as any)._count.chatMessages} AI chat messages
  </div>
)}
        </div>
      </CardContent>
    </Card>
  );
}