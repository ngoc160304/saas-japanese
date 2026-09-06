import axios from 'axios';

const API_URL = 'http://localhost:8000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface EndRoomRequest {
  room_name: string;
}

export interface EndRoomResponse {
  success: boolean;
  message: string;

  session_result?: {
    overall: number | null;
    pronunciation: number | null;
    grammar: number | null;
    vocabulary: number | null;
    relevance: number | null;

    utterances: {
      sentence: string;
      score: number | null;
      mean_distance: number | null;
      error: string | null;
    }[];
  };
}

export class LiveKitService {
  createRoom() {
    return axios.post(API_URL + '/create-room');
  }

  joinRoom(data: {
    room_name: string;
    user_id: string;
    user_name: string;
    topic: { id: string; title: string; description: string };
  }) {
    return axios.post(API_URL + '/join-room', data);
  }

  endRoom(data: EndRoomRequest) {
    return axios.post<EndRoomResponse>(API_URL + '/end-room', data);
  }
}
