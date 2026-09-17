import { ApiResponse } from '@/types/api';

export interface MediaResponse {
  id: number;
  originalName: string;
  publicId: string;
  secureUrl: string;
}

export type GetMediaResponse = ApiResponse<MediaResponse>;
