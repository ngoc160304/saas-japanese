import type { CourseDetailData } from './course-detail.types';

export const MOCK_COURSE_DETAIL = {
  id: 'mock-n3-soumatome',
  level: 'JLPT N3',
  badge: 'Bán chạy nhất',
  title: 'Tiếng Nhật Trung Cấp N3 Soumatome',
  description:
    'Lộ trình toàn diện ngữ pháp, từ vựng, đọc hiểu và nghe hiểu cho kỳ thi JLPT N3. Được thiết kế bám sát giáo trình Nihongo Soumatome, kết hợp ngân hàng bài tập thực hành sát đề thi thực tế.',
  rating: 4.9,
  reviewCount: 1240,
  studentCount: 12350,
  updatedAt: '2026-09-01T00:00:00+07:00',
  languages: 'Tiếng Việt & Tiếng Nhật',
  thumbnailUrl: null,
  price: 499000,
  originalPrice: 850000,
  discountPercentage: 41,
  outcomes: [
    {
      id: 'grammar-foundation',
      label: 'Nắm vững 100+ mẫu ngữ pháp cốt lõi N3 và cách ứng dụng thực tế',
    },
    {
      id: 'vocabulary-kanji',
      label: 'Ghi nhớ 1.200 từ vựng và 650 Kanji thông dụng xuất hiện trong đề thi',
    },
    {
      id: 'reading-analysis',
      label: 'Kỹ năng phân tích câu phức tạp trong bài đọc hiểu ngắn và trung văn',
    },
    {
      id: 'listening-reflex',
      label: 'Rèn luyện phản xạ bắt từ khóa phần Nghe hiểu với tốc độ thi thật',
    },
  ],
  syllabus: {
    moduleCount: 5,
    lessonCount: 55,
    duration: '40 giờ 45 phút',
    modules: [
      {
        id: 'module-grammar-foundations',
        title: 'Chương 1: Ngữ pháp nền tảng N3 & Từ vựng chủ đề Đời sống',
        lessonCount: 10,
        duration: '5h 20m',
        lessons: [
          {
            id: 'passive-causative',
            title: 'Bài 1: Cấu trúc thể bị động - sai khiến trong giao tiếp',
            kind: 'video',
            meta: '15:30',
            preview: true,
          },
          {
            id: 'cause-effect',
            title: 'Bài 2: Các cấu trúc biểu thị nguyên nhân & kết quả (〜せいで, 〜おかげで)',
            kind: 'video',
            meta: '18:45',
          },
          {
            id: 'family-vocabulary',
            title: 'Từ vựng & Kanji: 50 từ chủ đề Gia đình & Mối quan hệ',
            kind: 'resource',
            meta: '25 từ',
          },
          {
            id: 'chapter-one-quiz',
            title: 'Trắc nghiệm củng cố: Ngữ pháp & Kanji Chương 1',
            kind: 'quiz',
            meta: '15 câu hỏi',
          },
        ],
      },
      {
        id: 'module-conditions-office',
        title: 'Chương 2: Thể điều kiện, nguyện vọng & Từ vựng Công sở',
        lessonCount: 12,
        duration: '6h 15m',
        lessons: [
          {
            id: 'condition-comparison',
            title: 'Bài 3: Phân biệt 〜たら, 〜ば, 〜なら và 〜と',
            kind: 'video',
            meta: '22:10',
          },
          {
            id: 'expressing-wishes',
            title: 'Bài 4: Mẫu câu thể hiện nguyện vọng (〜てほしい, 〜たいものだ)',
            kind: 'video',
            meta: '19:30',
          },
        ],
      },
      {
        id: 'module-keigo-reading',
        title: 'Chương 3: Kính ngữ chuẩn mực & Đọc hiểu đoạn văn ngắn',
        lessonCount: 11,
        duration: '7h 00m',
        lessons: [
          {
            id: 'keigo',
            title: 'Bài 5: Tôn kính ngữ (尊敬語) & Khiêm nhường ngữ (謙譲語)',
            kind: 'video',
            meta: '25:15',
          },
          {
            id: 'reading-connectors',
            title: 'Bài 6: Phương pháp bắt từ nối và câu chủ đề trong Đọc hiểu',
            kind: 'video',
            meta: '30:00',
          },
        ],
      },
      {
        id: 'module-reading-listening',
        title: 'Chương 4: Kỹ thuật xử lý bài Trung văn & Nghe hiểu phản xạ',
        lessonCount: 11,
        duration: '10h 30m',
        lessons: [
          {
            id: 'skimming',
            title: 'Bài 7: Chiến thuật đọc lướt và tìm kiếm thông tin',
            kind: 'video',
            meta: '24:40',
          },
        ],
      },
      {
        id: 'module-mock-test',
        title: 'Chương 5: Giải đề thi thử N3 chính thức có bấm giờ',
        lessonCount: 11,
        duration: '11h 40m',
        lessons: [
          {
            id: 'mock-test-one',
            title: 'Đề Mock test 1: Kiến thức ngôn ngữ - Đọc hiểu - Nghe hiểu',
            kind: 'quiz',
            meta: 'Full Test',
          },
        ],
      },
    ],
  },
  requirements: [
    {
      id: 'n4-foundation',
      label:
        'Đã hoàn thành chương trình sơ cấp N4 hoặc nắm chắc khoảng 300 chữ Hán và 1.500 từ vựng cơ bản.',
    },
    {
      id: 'connected-device',
      label:
        'Có thiết bị (máy tính hoặc điện thoại thông minh) kết nối Internet để tham gia học trực tuyến.',
    },
    {
      id: 'daily-study',
      label: 'Dành ít nhất 45 - 60 phút mỗi ngày để luyện tập đều đặn.',
    },
  ],
  instructor: {
    name: 'ThS. Tanaka Taro',
    role: 'Chuyên gia giảng dạy JLPT cao cấp',
    initials: 'TT',
    biography:
      'Giảng viên với hơn 10 năm kinh nghiệm trực tiếp luyện thi JLPT các cấp độ từ N3 đến N1. Tốt nghiệp Thạc sĩ Ngôn ngữ học ứng dụng tại Đại học Tokyo, đã hướng dẫn hơn 20.000 học viên đỗ chứng chỉ JLPT với tỉ lệ đạt điểm cao trên 85%.',
  },
  benefits: [
    { id: 'video-lessons', label: '40 giờ video bài giảng chất lượng cao', icon: 'video' },
    {
      id: 'practice-materials',
      label: '55 bài học chi tiết & bài tập thực hành',
      icon: 'document',
    },
    { id: 'mock-exams', label: 'Bộ đề thi thử sát với kỳ thi thực tế', icon: 'exam' },
    { id: 'lifetime-access', label: 'Quyền truy cập học trọn đời', icon: 'lifetime' },
    {
      id: 'multi-device',
      label: 'Học trên máy tính, máy tính bảng và điện thoại',
      icon: 'devices',
    },
  ],
} satisfies CourseDetailData;
