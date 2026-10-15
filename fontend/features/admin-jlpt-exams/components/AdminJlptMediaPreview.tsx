'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export function AdminJlptMediaPreview(props: {
  kind: 'image' | 'audio';
  url: string;
  name: string;
  local?: boolean;
}) {
  const safe = props.local ? props.url.startsWith('blob:') : /^https?:\/\//i.test(props.url);
  return safe ? (
    <PreviewSource key={`${props.kind}:${props.url}`} {...props} />
  ) : (
    <p role="alert" className="text-xs text-rose-700">
      Không có đường dẫn media hợp lệ để xem.
    </p>
  );
}
function PreviewSource({
  kind,
  url,
  name,
}: {
  kind: 'image' | 'audio';
  url: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const player = audioRef.current;
    return () => {
      if (player) {
        player.pause();
        if (player.readyState > 0) player.currentTime = 0;
      }
    };
  }, []);
  return (
    <div className="min-w-0 space-y-2">
      {kind === 'image' ? (
        // URLs belong to backend-configured media hosts; native image also supports local blob previews.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={attempt}
          src={url}
          alt={name}
          onError={() => setFailed(true)}
          className="max-h-72 max-w-full rounded-xl object-contain"
        />
      ) : (
        <audio
          ref={audioRef}
          controls
          preload="metadata"
          src={url}
          aria-label={`Nghe ${name}`}
          onError={() => setFailed(true)}
          className="w-full min-w-0"
        />
      )}
      {failed && (
        <div role="alert" className="space-y-2 text-xs text-rose-700">
          <p>
            {kind === 'image'
              ? 'Không tải được ảnh.'
              : 'Không phát được audio. Trình duyệt có thể không hỗ trợ nội dung hoặc tệp chưa tải được.'}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFailed(false);
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.load();
              } else setAttempt((n) => n + 1);
            }}
          >
            Thử tải lại media
          </Button>
        </div>
      )}
    </div>
  );
}
