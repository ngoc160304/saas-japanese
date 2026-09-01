import axios from 'axios';

const API_URL = "http://localhost:8000";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export class LiveKitService {
  
  createRoom() {
    return axios.post(API_URL + "/create-room");
  }

  joinRoom(data: {
    room_name: string,
    user_id:string,
    user_name: string
  }) {
     return axios.post(API_URL + "/join-room", data);
  }
}
