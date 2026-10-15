import authorizeAxiosIntance from '@/lib/authorize-axios';
import type { GetMediaResponse, MediaResponse } from './upload.type';
const uploadImage = async (file: File) => {
  const formData = new FormData();

  formData.append('file', file);

  const response = await authorizeAxiosIntance.post<GetMediaResponse>(
    '/upload/images',
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

const uploadAudio = async (file: File, onProgress?: (percent: number) => void): Promise<MediaResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await authorizeAxiosIntance.post<GetMediaResponse>('/upload/audios', formData, {
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
  uploadAudio,
};
