import { ApiResponse } from '@/types/api';

export interface MediaResponse {
  id: number;
  originalName: string;
  publicId: string;
  secureUrl: string;
}

export type GetMediaResponse = ApiResponse<MediaResponse>;

export interface MediaUploadOptions {
  signal?: AbortSignal;
  /** null means the browser cannot determine the total size. */
  onProgress?: (percent: number | null) => void;
  localErrorHandling?: boolean;
}
