import authorizeAxiosIntance from '@/lib/authorize-axios';
import { API_VERSION } from '@/utils/constant';
import type { GetMediaResponse, MediaResponse } from './upload.type';
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/${API_VERSION}`;
const uploadImage = async (file: File) => {
  const formData = new FormData();

  formData.append('file', file);

  const response = await authorizeAxiosIntance.post<GetMediaResponse>(
    `${API_URL}/upload/images`,
    formData,
  );

  return response.data;
};

const uploadVideo = async (file: File, onProgress?: (percent: number) => void): Promise<MediaResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await authorizeAxiosIntance.post<GetMediaResponse>('/upload/videos', formData, {
    localErrorHandling: true,
    timeout: 120_000,
    onUploadProgress: (event) => {
      if (event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  return response.data.data;
};

export const uploadAPI = {
  uploadImage,
  uploadVideo,
};
