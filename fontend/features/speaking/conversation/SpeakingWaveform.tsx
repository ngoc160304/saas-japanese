'use client';

import { BarVisualizer } from '@livekit/components-react';

interface SpeakingWaveformProps {
  trackRef: any;
}

export default function SpeakingWaveform({ trackRef }: SpeakingWaveformProps) {
  return (
    <div className="flex h-16 w-full max-w-md items-center justify-center rounded-2xl bg-indigo-50/60 border border-indigo-100 px-4 py-2">
      <BarVisualizer trackRef={trackRef} className="h-full w-full text-indigo-600" />
    </div>
  );
}
