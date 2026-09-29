import type { VocabularyItem } from '../types/vocabulary';

export const lessonVocabularyMock = [
  {
    id: 'company-employee',
    word: '会社員',
    reading: 'かいしゃいん',
    meaning: 'Nhân viên công ty',
    exampleSentence: '彼は大手IT企業の会社員です。',
  },
  {
    id: 'overtime',
    word: '残業',
    reading: 'ざんぎょう',
    meaning: 'Làm thêm giờ, tăng ca',
    exampleSentence: '今週は毎日残業しなければなりません。',
  },
  {
    id: 'deadline',
    word: '締め切り',
    reading: 'しめきり',
    meaning: 'Hạn chót, deadline',
    exampleSentence: 'レポートの締め切りは金曜日です。',
  },
  {
    id: 'colleague',
    word: '同僚',
    reading: 'どうりょう',
    meaning: 'Đồng nghiệp',
    exampleSentence: '会社の同僚と一緒に昼ご飯を食べました。',
  },
  {
    id: 'business-trip',
    word: '出張',
    reading: 'しゅっちょう',
    meaning: 'Đi công tác',
    exampleSentence: '来週から大阪へ出張します。',
  },
] satisfies readonly VocabularyItem[];
