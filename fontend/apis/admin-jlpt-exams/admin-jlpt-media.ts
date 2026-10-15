export const ADMIN_JLPT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const ADMIN_JLPT_AUDIO_MAX_BYTES = 20 * 1024 * 1024;

const imageFormats: Record<string, readonly string[]> = {
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  gif: ['image/gif'],
};
const audioFormats: Record<string, readonly string[]> = {
  mp3: ['audio/mpeg'],
  wav: ['audio/wav', 'audio/x-wav', 'audio/wave'],
};

export function validateAdminJlptMedia(
  file: Pick<File, 'name' | 'type' | 'size'>,
  kind: 'image' | 'audio',
): string | null {
  if (!file.name.trim() || file.name.length > 255 || file.size <= 0)
    return 'Tệp phải có tên hợp lệ và có nội dung.';
  const max = kind === 'image' ? ADMIN_JLPT_IMAGE_MAX_BYTES : ADMIN_JLPT_AUDIO_MAX_BYTES;
  if (file.size > max) return `Tệp vượt quá giới hạn ${kind === 'image' ? 10 : 20} MiB.`;
  const extension = file.name.toLowerCase().split('.').pop() ?? '';
  const mime = file.type.split(';')[0].trim().toLowerCase();
  const formats = kind === 'image' ? imageFormats : audioFormats;
  if (!Object.hasOwn(formats, extension) || !formats[extension].includes(mime))
    return kind === 'image'
      ? 'Chọn ảnh .jpeg, .png, .webp hoặc .gif đúng định dạng.'
      : 'Chọn audio .mp3 hoặc .wav đúng định dạng.';
  return null;
}
