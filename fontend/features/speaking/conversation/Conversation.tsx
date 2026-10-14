'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { Bot } from 'lucide-react';
import type { TranscriptMessage } from '../types';
import MessageBubble from './MessageBubble';
import SpeakingWaveform from './SpeakingWaveform';
import SpeakingControls from './SpeakingControls';

interface ConversationProps {
  trackRef: TrackReferenceOrPlaceholder;
  messages: TranscriptMessage[];
  pendingAi: boolean;
  microphoneEnabled: boolean;
  microphonePending: boolean;
  onToggleMicrophone: () => void;
  onEnd: () => void;
}

export default function Conversation({
  trackRef,
  messages,
  pendingAi,
  microphoneEnabled,
  microphonePending,
  onToggleMicrophone,
  onEnd,
}: ConversationProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    container?.scrollTo({
      top: container.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [messages, pendingAi, reduceMotion]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-center gap-2 border-b border-slate-100 py-3 text-primary">
        <Bot className="size-6" aria-hidden="true" />
        <h2 className="font-semibold">Hội thoại trực tiếp</h2>
      </div>
      <div
        ref={containerRef}
        role="log"
        aria-label="Nội dung hội thoại"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-4"
      >
        {!messages.length && (
          <p className="py-8 text-center text-sm text-slate-500">Hãy bắt đầu nói để AI phản hồi.</p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble key={message.id} role={message.role} message={message.message} />
          ))}
        </AnimatePresence>
        {pendingAi && (
          <p role="status" className="text-sm text-slate-500">
            AI đang chuẩn bị phản hồi…
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-3 border-t border-slate-100 py-4">
        <SpeakingWaveform trackRef={trackRef} />
        <SpeakingControls
          onEnd={onEnd}
          microphoneEnabled={microphoneEnabled}
          microphonePending={microphonePending}
          onToggleMicrophone={onToggleMicrophone}
        />
      </div>
    </div>
  );
}
