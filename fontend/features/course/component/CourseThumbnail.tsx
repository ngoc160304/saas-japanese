'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CourseThumbnail({
  src,
  title,
  className,
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div
      className={cn(
        'flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-slate-400',
        className,
      )}
    >
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
        <>
          <BookOpen aria-hidden="true" className="size-6" />
          <span className="sr-only">Chưa có ảnh khóa học</span>
        </>
      )}
    </div>
  );
}
