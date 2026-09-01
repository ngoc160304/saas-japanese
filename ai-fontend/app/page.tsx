"use client";

import { LiveKitService } from "@/services/livekit.service";
import { useEffect, useState, useMemo } from "react";
import {
  AudioConference,
  SessionProvider,
  useSession,
  SessionEvent,
  useEvents,
} from "@livekit/components-react";
import { MediaDeviceFailure, TokenSource } from "livekit-client";

// Cấu hình URL từ biến môi trường (.env.local) hoặc fallback về localhost
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

const AudioExample = () => {
  // ------------------------- LiveKit Room States -----------------------------------
  const [room, setRoom] = useState<any>(null);
  const [joinRoom, setJoinRoom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initRoom = async () => {
      try {
        setIsLoading(true);

        // 1. Tạo phòng (Nếu LiveKitService dùng static class method thì gọi trực tiếp)
        const response = await LiveKitService.prototype.createRoom();
        const roomData = response.data;
        console.log("Đã tạo room:", roomData);
        setRoom(roomData);

        // 2. Nếu tạo phòng thành công, tiến hành tham gia phòng
        if (roomData?.name) {
          const responseJoin = await LiveKitService.prototype.joinRoom({
            room_name: roomData.name,
            user_id: "user123",
            user_name: "John Doe",
          });
          console.log("co token", responseJoin.data);
          // Cập nhật đúng vào state joinRoom
          setJoinRoom(responseJoin.data);
        }
      } catch (error) {
        console.error("Lỗi khởi tạo phòng LiveKit:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initRoom();
  }, []);
  // ------------------------- LiveKit Room End -----------------------------------
  // Hiển thị trạng thái chờ trong lúc API đang tải dữ liệu
  if (isLoading || !room || !joinRoom) {
    return (
      <div className="flex items-center justify-center p-6 text-sm text-gray-500">
        Đang khởi tạo và tham gia phòng...
      </div>
    );
  }

  return <LiveKitSession room={room} joinRoom={joinRoom} />;
};

const LiveKitSession = ({ room, joinRoom }: any) => {
  const params = useMemo(
    () => (typeof window !== "undefined" ? new URLSearchParams(location.search) : null),
    []
  );

  const roomName = room?.name ?? params?.get("room") ?? "test-room";
  const [userIdentity] = useState(() => params?.get("user") ?? "user123");
  // Dynamic URL & Token: Ưu tiên lấy serverUrl/token từ API joinRoom (nếu có)
  const serverUrl = joinRoom?.serverUrl || LIVEKIT_URL;
  const participantToken = joinRoom?.participantToken || joinRoom?.token;
  // const tokenSource = TokenSource.literal({serverUrl, participantToken,});
  const tokenSource = useMemo(() => {
    return TokenSource.literal({ serverUrl, participantToken });
  }, [serverUrl, participantToken]);
  const session = useSession(tokenSource, {
    roomName,
    participantIdentity: userIdentity,
    participantName: userIdentity,
  });

  // const [started, setStarted] = useState(false);
  // Chỉ chạy useEffect kích hoạt session khi ĐÃ CÓ đủ dữ liệu từ room và joinRoom
  //   const [started, setStarted] = useState(false);
  //   useEffect(() => {
  //   // Điều kiện rào chắn: Nếu chưa có dữ liệu room hoặc joinRoom thì DỪNG LẠI
  //   if (!room || !joinRoom) return;
  //     console.log("Starting session...");
  //   session
  //     .start({
  //       tracks: {
  //         microphone: { enabled: true },
  //       },
  //       roomConnectOptions: {
  //         autoSubscribe: true,
  //       },
  //     })
  //     .then(() => {
  //     console.log("Session started successfully");
  //     console.log("Session:", session);
  //   })
  //     .catch((err) => {
  //       console.error('Failed to start session:', err);
  //     });

  //   return () => {
  //       session.end().catch((err) => {
  //       console.error('Failed to end session:', err);
  //     });
  //   };
  //   // Theo dõi sự thay đổi của room, joinRoom và session
  // }, [room, joinRoom, session]);

  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!room || !joinRoom) return;

    if (started) {
      console.log("Starting session...");

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
          console.log("Session started successfully");
        })
        .catch((err) => {
          console.error("Failed to start session:", err);
        });
    } else {
      session.end().catch((err) => {
        console.error("Failed to end session:", err);
      });
    }
  }, [started, room, joinRoom]);

  useEvents(
    session,
    SessionEvent.MediaDevicesError,
    (error) => {
      const failure = MediaDeviceFailure.getFailure(error);
      console.error(failure);
      alert(
        "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
      );
    },
    []
  );

  return (
    <div data-lk-theme="default">
      <button onClick={() => setStarted(true)}>Connect</button>
      <button onClick={() => setStarted(false)}>Disconnect</button>
      <SessionProvider session={session}>
        <AudioConference />
      </SessionProvider>
    </div>
  );
};

export default AudioExample;
