'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TopicCard from './TopicCard';

export interface Topic {
  id: string;
  title: string;
  description: string;
}

interface TopicSelectionProps {
  onStart: (topic: Topic) => void;
}

const topics: Topic[] = [
  {
    id: 'work',
    title: 'Công việc',
    description: 'Luyện giao tiếp trong môi trường công sở',
  },
  {
    id: 'study',
    title: 'Học tập',
    description: 'Nói chuyện về trường học và việc học',
  },
  {
    id: 'travel',
    title: 'Du lịch',
    description: 'Luyện hội thoại khi đi du lịch',
  },
  {
    id: 'daily-life',
    title: 'Đời sống',
    description: 'Những tình huống giao tiếp hàng ngày',
  },
  {
    id: 'shopping',
    title: 'Mua sắm',
    description: 'Luyện giao tiếp tại cửa hàng',
  },
  {
    id: 'conversation',
    title: 'Giao tiếp',
    description: 'Hội thoại tiếng Nhật thông thường',
  },
];

export default function TopicSelection({ onStart }: TopicSelectionProps) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const handleStart = () => {
    if (!selectedTopic) return;

    onStart(selectedTopic);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Heading */}
      <div className="mb-8 text-center">
        <p className="text-xl font-semibold text-[#2B4C7E]">
          Chọn một chủ đề để bắt đầu cuộc hội thoại với AI
        </p>

        <p className="mt-2 text-sm text-[#64748B]">
          Luyện nói tiếng Nhật theo những tình huống thực tế
        </p>
      </div>

      {/* Topics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            id={topic.id}
            title={topic.title}
            description={topic.description}
            selected={selectedTopic?.id === topic.id}
            onClick={() => setSelectedTopic(topic)}
          />
        ))}
      </div>

      {/* Action */}
      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          disabled={!selectedTopic}
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
          Bắt đầu hội thoại
        </Button>
      </div>
    </div>
  );
}
