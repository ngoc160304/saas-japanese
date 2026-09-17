'use client';

import { Button } from '@/components/ui/button';
import { TrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface SpeakingControlsProps {
  onEnd: () => void;
}

export default function SpeakingControls({ onEnd }: SpeakingControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Nút Microphone màu xanh nổi bật */}
      <TrackToggle
        source={Track.Source.Microphone}
        className="
          flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95
        "
      >
        Microphone
      </TrackToggle>

      {/* Nút Kết thúc màu đỏ rõ ràng */}
      <Button
        onClick={onEnd}
        variant="destructive"
        className="
          h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 px-5 text-sm font-semibold shadow-none transition-all hover:bg-red-100 hover:text-red-700 active:scale-95
        "
      >
        Kết thúc
      </Button>
    </div>
  );
}
