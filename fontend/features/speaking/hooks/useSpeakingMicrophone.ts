'use client';

import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ConnectionState, type Room } from 'livekit-client';

export function useSpeakingMicrophone(room: Room) {
  const changing = useRef(false);
  const mutation = useMutation({
    retry: false,
    mutationFn: async () => {
      if (room.state !== ConnectionState.Connected)
        throw new Error('Phiên hội thoại chưa kết nối.');
      const publication = await room.localParticipant.setMicrophoneEnabled(
        !room.localParticipant.isMicrophoneEnabled,
      );
      if (room.state !== ConnectionState.Connected) publication?.track?.stop();
    },
  });
  async function toggle() {
    if (changing.current) return;
    changing.current = true;
    try {
      await mutation.mutateAsync();
    } catch {
      /* UI displays a permission/retry error. */
    } finally {
      changing.current = false;
    }
  }
  return {
    toggle,
    pending: mutation.isPending,
    error: mutation.isError
      ? 'Chưa thể thay đổi micro. Hãy kiểm tra quyền micro và thử lại.'
      : null,
  };
}
