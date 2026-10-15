import type { SpeakingTopic } from '@/apis/speaking/speaking.type';

export const SPEAKING_TOPICS: readonly SpeakingTopic[] = [
  {
    id: 'work',
    title: 'Công việc',
    description: 'Luyện giao tiếp trong môi trường công sở',
  },
  {
    id: 'study',
    title: 'Học tập',
    description: 'Nói chuyện về trường học và việc học',
  },
  {
    id: 'travel',
    title: 'Du lịch',
    description: 'Luyện hội thoại khi đi du lịch',
  },
  {
    id: 'daily-life',
    title: 'Đời sống',
    description: 'Những tình huống giao tiếp hàng ngày',
  },
  {
    id: 'shopping',
    title: 'Mua sắm',
    description: 'Luyện giao tiếp tại cửa hàng',
  },
  {
    id: 'conversation',
    title: 'Giao tiếp',
    description: 'Hội thoại tiếng Nhật thông thường',
  },
];
