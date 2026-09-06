'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import MessageBubble from './MessageBubble';
import SpeakingWaveform from './SpeakingWaveform';
import SpeakingControls from './SpeakingControls';

interface ConversationProps {
  trackRef: any;
  messages: {
    id: string;
    role: 'user' | 'ai';
    message: string;
  }[];
  onEnd: () => void;
}

export default function Conversation({ trackRef, messages, onEnd }: ConversationProps) {
  const shouldReduceMotion = useReducedMotion();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    const behavior = shouldReduceMotion ? 'auto' : 'smooth';

    const scrollToBottom = () => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    };

    if (behavior === 'smooth') {
      requestAnimationFrame(scrollToBottom);
    } else {
      scrollToBottom();
    }
  }, [messages, shouldReduceMotion]);

  return (
    <div className="flex h-full w-full flex-col p-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-xl font-bold text-slate-900">Luyện nói tiếng Nhật cùng AI</h3>
        <p className="mt-0.5 text-sm font-medium text-slate-500">
          Trò chuyện trực tiếp bằng giọng nói realtime
        </p>
      </div>

      {/* Messages Container (Tự động phình to h-full để chiếm hết khoảng trống) */}
      <div
        ref={messagesContainerRef}
        className="
          flex-1 space-y-4 overflow-y-auto py-4 pr-2
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-slate-200
        "
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <span className="text-3xl mb-2">🎙️</span>
            <p className="text-sm font-medium">Hãy bắt đầu nói để AI phản hồi...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} message={message.message} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Area (Sóng âm + Nút bấm ghim chặt xuống đáy) */}
      <div className="mt-auto border-t border-slate-100 pt-4 flex flex-col items-center gap-3">
        <SpeakingWaveform trackRef={trackRef} />
        <SpeakingControls onEnd={onEnd} />
      </div>
    </div>
  );
}
