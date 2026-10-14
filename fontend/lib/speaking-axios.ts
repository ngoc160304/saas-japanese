import axios from 'axios';

// ai-service/main.py currently uses no Spring authentication.
// Keep both cookies and Spring Authorization headers off this separate origin.
const speakingAxios = axios.create({ timeout: 30_000, withCredentials: false });

export function requireSpeakingApiUrl() {
  const value = process.env.NEXT_PUBLIC_SPEAKING_API_URL?.trim();
  if (!value) throw new Error('Chưa cấu hình NEXT_PUBLIC_SPEAKING_API_URL cho dịch vụ hội thoại.');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('NEXT_PUBLIC_SPEAKING_API_URL phải là URL HTTP hoặc HTTPS hợp lệ.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('NEXT_PUBLIC_SPEAKING_API_URL phải là URL HTTP hoặc HTTPS hợp lệ.');
  return value.replace(/\/$/, '');
}

export default speakingAxios;
