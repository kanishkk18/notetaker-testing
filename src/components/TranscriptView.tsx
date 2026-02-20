'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TranscriptSegment } from '@/types';
import { User, Clock } from 'lucide-react';

interface TranscriptViewProps {
  transcript: TranscriptSegment[];
  speakers: string[];
}

export function TranscriptView({ transcript, speakers }: TranscriptViewProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);

  const filteredTranscript = selectedSpeaker
    ? transcript.filter((segment) => segment.speaker === selectedSpeaker)
    : transcript;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {speakers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-500">Filter by speaker:</span>
              <Badge
                variant={selectedSpeaker === null ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedSpeaker(null)}
              >
                All
              </Badge>
              {speakers.map((speaker) => (
                <Badge
                  key={speaker}
                  variant={selectedSpeaker === speaker ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => setSelectedSpeaker(speaker)}
                >
                  <User className="w-3 h-3 mr-1" />
                  {speaker}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-4">
              {filteredTranscript.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No transcript available yet
                </p>
              ) : (
                filteredTranscript.map((segment, idx) => (
                  <div
                    key={idx}
                    className="group hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {segment.speaker}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(segment.offset)}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {segment.words?.map((w) => w.word).join(' ') || segment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}