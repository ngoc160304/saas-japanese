export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const acceptedTypes: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  quicktime: 'video/quicktime',
};

export function validateVideoFile(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  if (file.size === 0) return 'Video không được để trống.';
  if (file.size > MAX_VIDEO_BYTES) return 'Video không được vượt quá 100 MB.';
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!acceptedTypes[extension] || acceptedTypes[extension] !== file.type)
    return 'Chỉ hỗ trợ video MP4, WebM hoặc MOV.';
  return null;
}
