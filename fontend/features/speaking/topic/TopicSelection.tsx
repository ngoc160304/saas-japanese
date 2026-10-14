'use client';

import { useState } from 'react';
import type { SpeakingTopic } from '@/apis/speaking/speaking.type';
import { Button } from '@/components/ui/button';
import TopicCard from './TopicCard';

interface TopicSelectionProps {
  topics: SpeakingTopic[];
  loading: boolean;
  pending: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onStart: (topic: SpeakingTopic) => void;
}

export default function TopicSelection({
  topics,
  loading,
  pending,
  error,
  page,
  totalPages,
  onRetry,
  onPageChange,
  onStart,
}: TopicSelectionProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = topics.find((topic) => topic.id === selectedId);
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-primary">
          Chọn một chủ đề để bắt đầu cuộc hội thoại với AI
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Luyện nói tiếng Nhật theo những tình huống thực tế
        </p>
      </div>
      {error ? (
        <div role="alert" className="space-y-3 py-8 text-center">
          <p>{error}</p>
          <Button onClick={onRetry} disabled={loading}>
            Thử tải lại
          </Button>
        </div>
      ) : loading ? (
        <p role="status" className="py-12 text-center text-slate-500">
          Đang tải chủ đề…
        </p>
      ) : !topics.length ? (
        <p className="py-12 text-center text-slate-500">Chưa có chủ đề hội thoại được công bố.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard
              key={topic.id}
              title={topic.title}
              description={topic.description}
              selected={selectedId === topic.id}
              disabled={pending}
              onClick={() => setSelectedId(topic.id)}
            />
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={page === 0 || pending || loading}
            onClick={() => onPageChange(page - 1)}
          >
            Trước
          </Button>
          <span className="text-sm">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page + 1 >= totalPages || pending || loading}
            onClick={() => onPageChange(page + 1)}
          >
            Sau
          </Button>
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <Button
          disabled={!selected || pending || loading || Boolean(error)}
          onClick={() => {
            if (selected) onStart(selected);
          }}
          className="h-10 rounded-xl bg-primary px-6 text-white hover:bg-primary/90"
        >
          {pending ? 'Đang kết nối…' : 'Bắt đầu hội thoại'}
        </Button>
      </div>
    </div>
  );
}
