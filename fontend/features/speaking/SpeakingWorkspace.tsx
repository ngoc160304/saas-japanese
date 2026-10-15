'use client';

import { useState } from 'react';
import { RoomContext } from '@livekit/components-react';
import '@livekit/components-styles';
import type { AuthUser } from '@/apis/auth/auth.type';
import type { SpeakingTopic } from '@/apis/speaking/speaking.type';
import { Button } from '@/components/ui/button';
import { selectAuthInitialized, selectCurrentUser, selectIsAuthenticated } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import { useSpeakingSession } from './hooks/useSpeakingSession';
import SpeakingLayout from './layout/SpeakingLayout';
import TopicSelection from './topic/TopicSelection';
import SpeakingResult from './result/SpeakingResult';
import { SpeakingLiveSession } from './conversation/SpeakingLiveSession';
import MessageBubble from './conversation/MessageBubble';

function AuthenticatedSpeakingWorkspace({ user }: { user: AuthUser }) {
  const [selectedTopic, setSelectedTopic] = useState<SpeakingTopic | null>(null);
  const session = useSpeakingSession(user);
  function start(topic: SpeakingTopic) {
    setSelectedTopic(topic);
    void session.start(topic);
  }
  return (
    <SpeakingLayout>
      {session.phase === 'idle' || session.phase === 'starting' ? (
        <TopicSelection pending={session.phase === 'starting'} onStart={start} />
      ) : session.phase === 'active' && session.room ? (
        <RoomContext.Provider value={session.room}>
          <SpeakingLiveSession
            room={session.room}
            messages={session.messages}
            pendingAi={session.pendingAi}
            onEnd={() => void session.end()}
          />
        </RoomContext.Provider>
      ) : session.phase === 'ending' ? (
        <p role="status" className="py-12 text-center text-slate-500">
          Micro đã tắt. Đang lấy đánh giá…
        </p>
      ) : session.phase === 'result' ? (
        <SpeakingResult
          result={session.result}
          onBackToTopics={session.reset}
          onRetry={() => void session.end(true)}
        />
      ) : (
        <div role="alert" className="space-y-4 py-8 text-center">
          <p className="text-sm text-rose-700">{session.error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={session.reset}>
              Quay lại chủ đề
            </Button>
            {session.canRetryResult ? (
              <Button onClick={() => void session.end(true)}>Thử lấy đánh giá lại</Button>
            ) : (
              selectedTopic && <Button onClick={() => start(selectedTopic)}>Thử kết nối lại</Button>
            )}
          </div>
        </div>
      )}
      {session.eventWarning && (
        <p role="status" className="mt-3 text-sm text-amber-700">
          {session.eventWarning}
        </p>
      )}
      {['result', 'error'].includes(session.phase) && session.messages.length > 0 && (
        <section
          className="mt-6 space-y-4 border-t border-slate-100 pt-4"
          aria-label="Hội thoại vừa thực hiện"
        >
          <h2 className="font-semibold">Nội dung hội thoại</h2>
          {session.messages.map((message) => (
            <MessageBubble key={message.id} role={message.role} message={message.message} />
          ))}
        </section>
      )}
    </SpeakingLayout>
  );
}

export function SpeakingWorkspace() {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  if (!initialized || !authenticated || !user)
    return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  return <AuthenticatedSpeakingWorkspace key={user.id} user={user} />;
}
