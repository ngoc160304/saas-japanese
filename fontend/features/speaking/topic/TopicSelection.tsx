'use client';

import { useState } from 'react';
import type { SpeakingTopic } from '@/apis/speaking/speaking.type';
import { Button } from '@/components/ui/button';
import TopicCard from './TopicCard';
import { SPEAKING_TOPICS } from './topics';

interface TopicSelectionProps {
  pending: boolean;
  onStart: (topic: SpeakingTopic) => void;
}

export default function TopicSelection({ pending, onStart }: TopicSelectionProps) {
  const [selectedTopic, setSelectedTopic] = useState<SpeakingTopic | null>(null);

  const handleStart = () => {
    if (!selectedTopic || pending) return;
    onStart(selectedTopic);
  };

  return (
    <div className="mx-auto max-w-5xl px-0 py-6 sm:px-6 sm:py-10">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-semibold text-[#2B4C7E]">
          Chọn một chủ đề để bắt đầu cuộc hội thoại với AI
        </h2>
        <p className="mt-2 text-sm text-[#64748B]">
          Luyện nói tiếng Nhật theo những tình huống thực tế
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SPEAKING_TOPICS.map((topic) => (
          <TopicCard
            key={topic.id}
            id={topic.id}
            title={topic.title}
            description={topic.description}
            selected={selectedTopic?.id === topic.id}
            disabled={pending}
            onClick={() => setSelectedTopic(topic)}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          type="button"
          size="lg"
          disabled={!selectedTopic || pending}
          onClick={handleStart}
          className="
            h-11 min-w-[200px]
            rounded-xl
            bg-[#2F80ED]
            px-8
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition-all
            hover:bg-[#2B4C7E]
            hover:shadow-md
            disabled:bg-slate-200
            disabled:text-slate-400
            disabled:opacity-100
          "
        >
          {pending ? 'Đang kết nối…' : 'Bắt đầu hội thoại'}
        </Button>
      </div>
    </div>
  );
}
