'use client';

import { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  status: string;
}

export function VideoPlayer({ videoUrl, status }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!videoUrl) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Video not available yet</p>
            <p className="text-sm text-gray-400">
              {status === 'COMPLETED' 
                ? 'Processing video...' 
                : 'Recording in progress...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full rounded-t-lg"
            onEnded={() => setIsPlaying(false)}
            controls={false}
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <div className="flex-1" />
            <span className="text-white text-sm">Use browser controls for full functionality</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}