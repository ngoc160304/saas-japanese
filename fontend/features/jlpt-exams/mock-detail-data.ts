import type { JlptExamDetail } from './detail-types';

export const mockExamDetails: JlptExamDetail[] = [
  {
    id: '1',
    level: 'N5',
    category: 'JLPT MOCK EXAM',
    title: 'JLPT N5 Korean Practice Test 1 – 2026',
    description: 'Official mock examination with 3 standard JLPT sessions: Language Knowledge (Kanji & Vocabulary), Grammar & Reading, and Listening.',
    passingScore: 80,
    maximumScore: 180,
    sessions: [
      {
        id: 'session-1', number: 1, japaneseTitle: '言語知識（文字・語彙）',
        englishSubtitle: 'Language Knowledge (Vocabulary)', durationMinutes: 20,
        mondaiSections: [
          { id: 'session-1-mondai-1', label: 'もんだい 1', description: 'Kanji Reading (漢字読み)', questionCount: 7 },
          { id: 'session-1-mondai-2', label: 'もんだい 2', description: 'Orthography (表記)', questionCount: 5 },
          { id: 'session-1-mondai-3', label: 'もんだい 3', description: 'Contextually-defined Expressions (文脈規定)', questionCount: 6 },
          { id: 'session-1-mondai-4', label: 'もんだい 4', description: 'Paraphrases (言い換え類義)', questionCount: 3 },
        ],
      },
      {
        id: 'session-2', number: 2, japaneseTitle: '言語知識（文法）・読解',
        englishSubtitle: 'Language Knowledge (Grammar) & Reading', durationMinutes: 40,
        mondaiSections: [
          { id: 'session-2-mondai-1', label: 'もんだい 1', description: 'Grammar Forms (文法形式の判断)', questionCount: 9 },
          { id: 'session-2-mondai-2', label: 'もんだい 2', description: 'Sentence Composition (文の組み立て)', questionCount: 4 },
          { id: 'session-2-mondai-3', label: 'もんだい 3', description: 'Text Grammar (文章の文法)', questionCount: 4 },
          { id: 'session-2-mondai-4', label: 'もんだい 4', description: 'Short & Mid Reading (短文・中文読解)', questionCount: 5 },
        ],
      },
      {
        id: 'session-3', number: 3, japaneseTitle: '聴解',
        englishSubtitle: 'Listening Comprehension (Choukai)', durationMinutes: 31,
        mondaiSections: [
          { id: 'session-3-mondai-1', label: 'もんだい 1', description: 'Task-based Comprehension (課題理解)', questionCount: 7 },
          { id: 'session-3-mondai-2', label: 'もんだい 2', description: 'Key Points Comprehension (ポイント理解)', questionCount: 6 },
          { id: 'session-3-mondai-3', label: 'もんだい 3', description: 'Utterance Expressions (発話表現)', questionCount: 5 },
          { id: 'session-3-mondai-4', label: 'もんだい 4', description: 'Quick Response (即時応答)', questionCount: 6 },
        ],
      },
    ],
  },
];
