import authorizeAxiosIntance from '@/lib/authorize-axios';
import { API_VERSION } from '@/utils/constant';
import { QueryParams } from '@/types/query';
import { GetMediaResponse } from './upload.type';
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

export const uploadAPI = {
  uploadImage,
};
