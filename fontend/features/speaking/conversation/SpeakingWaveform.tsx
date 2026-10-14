'use client';

import { BarVisualizer, type TrackReferenceOrPlaceholder } from '@livekit/components-react';

export default function SpeakingWaveform({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  return (
    <div className="flex h-14 w-full max-w-md items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2">
      <BarVisualizer trackRef={trackRef} className="h-full w-full text-primary" />
    </div>
  );
}
