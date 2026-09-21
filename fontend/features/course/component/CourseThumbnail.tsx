'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';

export function CourseThumbnail({ src, title }: { src: string | null; title: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
      {src && src !== failedSrc ? (
        // Backend media URLs are remote and do not require the Next image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          width={48}
          height={48}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <BookOpen aria-label="Chưa có ảnh khóa học" className="size-6" />
      )}
    </div>
  );
}
