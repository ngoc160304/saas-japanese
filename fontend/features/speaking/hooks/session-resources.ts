import type { LocalAudioTrack, Room } from 'livekit-client';
import type { EndRoomResponse } from '@/apis/speaking/speaking.type';

export interface SessionResources {
  roomName: string | null;
  room: Room | null;
  microphone: LocalAudioTrack | null;
  detach: () => void;
  endPromise: Promise<EndRoomResponse> | null;
}

export function releaseSessionMedia(resource: SessionResources) {
  resource.detach();
  resource.detach = () => {};
  const room = resource.room;
  const tracks = new Set([
    resource.microphone,
    ...Array.from(
      room?.localParticipant.trackPublications.values() ?? [],
      (publication) => publication.track,
    ),
  ]);
  for (const track of tracks) track?.stop();
  resource.microphone = null;
  resource.room = null;
  if (room) {
    void room.disconnect(true).catch(() => undefined);
  }
}

export function endServerSession(
  resource: SessionResources,
  end: (roomName: string) => Promise<EndRoomResponse>,
) {
  if (!resource.roomName) return null;
  resource.endPromise ??= end(resource.roomName);
  return resource.endPromise;
}
