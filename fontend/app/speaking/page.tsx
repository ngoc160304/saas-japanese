"use client";

import { Button } from "@/components/ui/button";
import { LiveKitService } from "@/services/livekit.service";
import {
  RoomAudioRenderer,
  SessionProvider,
  useSession,
  BarVisualizer,
  TrackToggle,
  StartAudio,
  useLocalParticipant,
  DisconnectButton,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  DataPacket_Kind,
  RemoteParticipant,
  RoomEvent,
  TokenSource,
  Track,
} from "livekit-client";
import { useEffect, useMemo, useState } from "react";

const LIVEKIT_URL = "wss://jlpt-learning-itys0a6n.livekit.cloud";
const USERID = "ngoc_123";
const USERNAME = "Ngoc Nguyen";

function MicSection() {
  const { localParticipant, microphoneTrack } = useLocalParticipant();

  if (!microphoneTrack) {
    return null;
  }

  const trackRef = {
    participant: localParticipant,
    publication: microphoneTrack,
    source: Track.Source.Microphone,
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[400px] h-[120px] bg-black rounded-xl p-4">
        <BarVisualizer trackRef={trackRef} className="h-full w-full" />
      </div>
      <div className="flex gap-4">
        <TrackToggle
          source={Track.Source.Microphone}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Toggle Mic
        </TrackToggle>
        <DisconnectButton className="px-4 py-2 bg-red-500 text-white rounded-lg">
          End Call
        </DisconnectButton>
      </div>
    </div>
  );
}

const Speaking = () => {
  const [room, setRoom] = useState<any>(null);
  const [joinRoom, setJoinRoom] = useState<any>(null);

  const handleJoinRoom = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const roomData = (await LiveKitService.prototype.createRoom()).data;
    setRoom(roomData);

    if (roomData?.name) {
      const responseJoin = await LiveKitService.prototype.joinRoom({
        room_name: roomData.name,
        user_id: USERID,
        user_name: USERNAME,
      });
      setJoinRoom(responseJoin.data);
    }
  };
  return (
    <>
      <div>
        <Button variant="default" size="lg" onClick={handleJoinRoom}>
          Speaking with AI
        </Button>
      </div>
      <div>
        {room?.name && joinRoom?.participantToken && (
          <SessionLiveKit room={room} joinRoom={joinRoom} />
        )}
      </div>
    </>
  );
};

const SessionLiveKit = ({ room, joinRoom }: any) => {
  const serverUrl = joinRoom?.serverUrl || LIVEKIT_URL;
  const participantToken = joinRoom?.participantToken || joinRoom?.token;
  const tokenSource = useMemo(() => {
    return TokenSource.literal({ serverUrl, participantToken });
  }, [serverUrl, participantToken]);

  const session = useSession(tokenSource, {
    roomName: room?.name || "default-room",
    participantIdentity: USERID,
    participantName: USERNAME,
  });

  useEffect(() => {
    let cancelled = false;
    console.log("Session started");
    session
      .start({
        tracks: {
          microphone: { enabled: true },
        },
        roomConnectOptions: {
          autoSubscribe: true,
        },
      })
      .then(() => {
        if (cancelled) return;
        const rs = session.room;
        if (!rs) return;
        const publication = rs.localParticipant.getTrackPublication(Track.Source.Microphone);

        console.log("MIC PUBLICATION:", publication);
        console.log("MIC TRACK:", publication?.track);
        // Engine is connected here — safe to publish
        // await rs.localParticipant.setMicrophoneEnabled(true);
        const handleDataReceived = (
          payload: Uint8Array,
          participant?: RemoteParticipant,
          kind?: DataPacket_Kind
        ) => {
          const text = new TextDecoder().decode(payload);
          console.log("Received data : ", text);
        };
        rs.on(RoomEvent.DataReceived, handleDataReceived);
      })
      .catch((err) => {
        console.error("Failed to start session / enable mic:", err);
      });

    return () => {
      cancelled = true;
      session.end().catch((err) => {
        console.error("Failed to end session:", err);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.start, session.end]);
  // useEffect(() => {
  //   const room = session.room;
  //   if (!room) return;

  //   room.on(RoomEvent.ParticipantConnected, (p) => {
  //     console.log("Participant:", p.identity);
  //   });

  //   room.on(RoomEvent.TrackPublished, (pub, participant) => {
  //     console.log("Track published:", participant.identity, pub.trackName, pub.kind);
  //   });

  //   room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
  //     console.log("Track subscribed:", participant.identity, pub.trackName, track.kind);
  //   });

  //   room.on(RoomEvent.TrackUnsubscribed, () => {
  //     console.log("Track unsubscribed");
  //   });
  // }, [session.room]);
  return (
    <SessionProvider session={session}>
      <StartAudio label="Enable Audio" />
      <RoomAudioRenderer />
      <MicSection />
    </SessionProvider>
  );
};
export default Speaking;
