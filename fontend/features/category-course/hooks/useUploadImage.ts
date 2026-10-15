import { uploadAPI } from '@/apis/upload/upload.api';
import { useMutation } from '@tanstack/react-query';

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => uploadAPI.uploadImage(file),
  });
}
