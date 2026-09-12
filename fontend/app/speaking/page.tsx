'use client';
import SpeakingResult from '@/components/speaking/result/SpeakingResult';
import SpeakingLayout from '@/components/speaking/layout/SpeakingLayout';
import Conversation from '@/components/speaking/conversation/Conversation';
import TopicSelection, { Topic } from '@/components/speaking/topic/TopicSelection';
import { LiveKitService } from '@/services/livekit.service';
import {
  RoomAudioRenderer,
  SessionProvider,
  useSession,
  StartAudio,
  useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { DataPacket_Kind, RemoteParticipant, RoomEvent, TokenSource, Track } from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'ai';
  message: string;
};

const LIVEKIT_URL = 'wss://jlpt-learning-itys0a6n.livekit.cloud';
const USERID = 'ngoc_123';
const USERNAME = 'Ngoc Nguyen';

function MicSection({ onEnd, messages }: { onEnd: () => void; messages: Message[] }) {
  const { localParticipant, microphoneTrack } = useLocalParticipant();

  // Khi chưa có mic, hiển thị trạng thái chờ ngay trong khung chính luôn
  if (!microphoneTrack) {
    return (
      <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-slate-500">
        <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        Đang kết nối micro...
      </div>
    );
  }

  const trackRef = {
    participant: localParticipant,
    publication: microphoneTrack,
    source: Track.Source.Microphone,
  };

  return <Conversation trackRef={trackRef} messages={messages} onEnd={onEnd} />;
}

const Speaking = () => {
  const [room, setRoom] = useState<any>(null);
  const [joinRoom, setJoinRoom] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleJoinRoom = async (topic: Topic) => {
    const roomData = (await LiveKitService.prototype.createRoom()).data;
    setRoom(roomData);

    if (roomData?.name) {
      const responseJoin = await LiveKitService.prototype.joinRoom({
        room_name: roomData.name,
        user_id: USERID,
        user_name: USERNAME,
        topic,
      });
      setJoinRoom(responseJoin.data);
      setIsSpeaking(true);
      setResult(null);
    }
  };
<<<<<<< HEAD

=======
  
>>>>>>> c222501 (Add score service and UI)
  const handleStartSpeaking = async (topic: Topic) => {
    setSelectedTopic(topic);
    setMessages([]);
    await handleJoinRoom(topic);
  };
  return (
    <SpeakingLayout>
      {/* Topic Selection */}
      {!isSpeaking && !result && <TopicSelection onStart={handleStartSpeaking} />}

      {/* Conversation */}
      {isSpeaking && room?.name && joinRoom?.participantToken && (
        <SessionLiveKit
          room={room}
          joinRoom={joinRoom}
          topic={selectedTopic}
          messages={messages}
          setMessages={setMessages}
          onEnd={(sessionResult: any) => {
            setResult(sessionResult);
            setIsSpeaking(false);
          }}
        />
      )}

      {/* Result */}
      {!isSpeaking && result && (
        <SpeakingResult
          result={result}
          onBackToTopics={() => {
            setResult(null);
            setSelectedTopic(null);
          }}
        />
      )}
    </SpeakingLayout>
  );
};

const SessionLiveKit = ({
  room,
  joinRoom,
  topic,
  onEnd,
  messages,
  setMessages,
}: {
  room: any;
  joinRoom: any;
  topic: Topic | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onEnd: (result: any) => void;
}) => {
  const serverUrl = joinRoom?.serverUrl || LIVEKIT_URL;
  const participantToken = joinRoom?.participantToken || joinRoom?.token;
  const tokenSource = useMemo(() => {
    return TokenSource.literal({ serverUrl, participantToken });
  }, [serverUrl, participantToken]);

  const session = useSession(tokenSource, {
    roomName: room?.name || 'default-room',
    participantIdentity: USERID,
    participantName: USERNAME,
  });

  const handleEnd = async () => {
    try {
      const response = await LiveKitService.prototype.endRoom({
        room_name: room.name,
      });
      const sessionResult = response.data.session_result;
      console.log('RESULT:', sessionResult);
      await session.end();
      onEnd(sessionResult);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    console.log('Session started');
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

        console.log('MIC PUBLICATION:', publication);
        console.log('MIC TRACK:', publication?.track);
        // Engine is connected here — safe to publish
        // await rs.localParticipant.setMicrophoneEnabled(true);
        const handleDataReceived = (
          payload: Uint8Array,
          participant?: RemoteParticipant,
          kind?: DataPacket_Kind,
        ) => {
          try {
            const text = new TextDecoder().decode(payload);
            console.log('Received data:', text);
            const data = JSON.parse(text);
<<<<<<< HEAD
            if (data.type === 'user_message') {
              setMessages((prev) => [
                ...prev,
                {
                  id: `${Date.now()}-user`,
                  role: 'user',
                  message: data.text,
                },
                {
                  id: `${Date.now()}-ai`,
                  role: 'ai',
                  message: '...',
                },
              ]);
            }

            if (data.type === 'ai_message') {
              setMessages((prev) => {
                const messages = [...prev];

                // tìm message AI cuối cùng đang là "..."
                const index = messages.findLastIndex(
                  (message) => message.role === 'ai' && message.message === '...',
                );

                if (index !== -1) {
                  messages[index] = {
                    ...messages[index],
                    message: data.text,
                  };
                }

                return messages;
              });
            }
=======
            if (data.type !== 'conversation') {
              return;
            }
            setMessages((prev) => [
              ...prev,
              {
                id: `${Date.now()}-user`,
                role: 'user',
                message: data.user,
              },
              {
                id: `${Date.now()}-ai`,
                role: 'ai',
                message: data.ai,
              },
            ]);
>>>>>>> c222501 (Add score service and UI)
          } catch (error) {
            console.error('Failed to parse conversation data:', error);
          }
        };
        rs.on(RoomEvent.DataReceived, handleDataReceived);
      })
      .catch((err) => {
        console.error('Failed to start session / enable mic:', err);
      });

    return () => {
      cancelled = true;
      session.end().catch((err) => {
        console.error('Failed to end session:', err);
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
      <RoomAudioRenderer />
      <div className="relative flex h-[650px] w-full flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="absolute top-3 right-3 z-10">
          <StartAudio
            label="Enable Audio"
            className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
          />
        </div>
        <MicSection onEnd={handleEnd} messages={messages} />
      </div>
    </SessionProvider>
  );
};
export default Speaking;
