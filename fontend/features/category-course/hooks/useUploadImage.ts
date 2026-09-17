import { uploadAPI } from '@/apis/upload/upload.api';
import { useMutation } from '@tanstack/react-query';

export function useUploadImage() {
  return useMutation({
    mutationFn: uploadAPI.uploadImage,
  });
}
