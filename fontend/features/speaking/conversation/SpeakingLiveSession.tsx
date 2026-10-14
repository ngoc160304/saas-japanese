'use client';

import { RoomAudioRenderer, StartAudio, useLocalParticipant } from '@livekit/components-react';
import { Track, type Room } from 'livekit-client';
import { useSpeakingMicrophone } from '../hooks/useSpeakingMicrophone';
import type { TranscriptMessage } from '../types';
import Conversation from './Conversation';

export function SpeakingLiveSession({
  room,
  messages,
  pendingAi,
  onEnd,
}: {
  room: Room;
  messages: TranscriptMessage[];
  pendingAi: boolean;
  onEnd: () => void;
}) {
  const { localParticipant, microphoneTrack, isMicrophoneEnabled } = useLocalParticipant();
  const microphone = useSpeakingMicrophone(room);
  const trackRef = {
    participant: localParticipant,
    publication: microphoneTrack,
    source: Track.Source.Microphone,
  };
  return (
    <div className="flex h-[min(650px,calc(100dvh-14rem))] min-h-80 flex-col">
      <RoomAudioRenderer />
      <div className="flex shrink-0 justify-end">
        <StartAudio
          label="Bật âm thanh"
          className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700"
        />
      </div>
      {microphone.error && (
        <p role="alert" className="text-sm text-rose-700">
          {microphone.error}
        </p>
      )}
      <Conversation
        trackRef={trackRef}
        messages={messages}
        pendingAi={pendingAi}
        microphoneEnabled={isMicrophoneEnabled}
        microphonePending={microphone.pending}
        onToggleMicrophone={() => void microphone.toggle()}
        onEnd={onEnd}
      />
    </div>
  );
}
