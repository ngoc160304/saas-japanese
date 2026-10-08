import type { ExamQuestion, ExamTakingMock, QuestionTextSegment } from './types';

const options = (a: string, b: string, c: string, d: string): ExamQuestion['options'] => [
  { id: 1, text: a }, { id: 2, text: b }, { id: 3, text: c }, { id: 4, text: d },
];
const underlined = (before: string, target: string, after: string): QuestionTextSegment[] => [
  { text: before }, { text: target, underlined: true }, { text: after },
];
const plain = (text: string): QuestionTextSegment[] => [{ text }];
const question = (number: number, text: QuestionTextSegment[], choices: ExamQuestion['options']): ExamQuestion => ({
  id: `question-${number}`, number, text, options: choices,
});

export const mockTakingExams: ExamTakingMock[] = [
  {
    id: '1', title: 'JLPT N5 PRACTICE EXAM', breakMinutes: 5,
    sections: [
      {
        id: 'session-1', title: '言語知識（文字・語彙）', durationMinutes: 20, status: 'active',
        groups: [
          {
            id: 'kanji-reading', label: 'もんだい 1', englishLabel: 'Kanji Reading',
            instructions: ['＿＿＿の ことばは ひらがなで どう かきますか。', '1・2・3・4 から いちばん いいものを ひとつ えらんで ください。'],
            questions: [
              question(1, underlined('およいで ', '川', 'を わたりました。'), options('はし', 'かわ', 'そら', 'みち')),
              question(2, underlined('きのうは ', '雨', 'が ふりました。'), options('ゆき', 'かぜ', 'あめ', 'くも')),
              question(3, underlined('わたしの ', '先生', 'は やさしいです。'), options('せんせい', 'がくせい', 'ともだち', 'いしゃ')),
              question(4, underlined('あの ', '山', 'は たかいです。'), options('かわ', 'やま', 'うみ', 'まち')),
              question(5, underlined('まいにち ', '学校', 'へ いきます。'), options('がっこう', 'かいしゃ', 'びょういん', 'としょかん')),
              question(6, underlined('きょうは ', '今日', 'も べんきょうします。'), options('あした', 'きのう', 'きょう', 'まいにち')),
              question(7, underlined('つめたい ', '水', 'を のみます。'), options('ひ', 'みず', 'おちゃ', 'ゆ')),
            ],
          },
          {
            id: 'orthography', label: 'もんだい 2', englishLabel: 'Orthography',
            instructions: ['＿＿＿の ことばは どう かきますか。', '1・2・3・4 から いちばん いいものを ひとつ えらんで ください。'],
            questions: [
              question(8, underlined('えきまで ', 'あるいて', ' いきます。'), options('歩いて', '走って', '乗って', '飛んで')),
              question(9, underlined('あたらしい ', 'くるま', 'を かいました。'), options('傘', '本', '靴', '車')),
              question(10, underlined('あした ', 'ともだち', 'に あいます。'), options('先生', '友達', '家族', '学生')),
              question(11, underlined('まいにち ', 'あさ', 'に はしります。'), options('夜', '昼', '朝', '夕')),
              question(12, underlined('この ', 'でんしゃ', 'は はやいです。'), options('自転車', '電車', '車', '駅')),
            ],
          },
          {
            id: 'context-expressions', label: 'もんだい 3', englishLabel: 'Contextually-defined Expressions',
            instructions: ['（　　　）に なにを いれますか。', '1・2・3・4 から いちばん いいものを ひとつ えらんで ください。'],
            questions: [
              question(13, plain('この へやは（　　　）です。'), options('ひろい', 'あまい', 'ながい', 'おもい')),
              question(14, plain('のどが かわいたので、（　　　）を のみます。'), options('パン', 'みず', 'ほん', 'くつ')),
              question(15, plain('さむいですから、（　　　）を きます。'), options('コート', 'ぼうし', 'くつ', 'かばん')),
              question(16, plain('えきは ここから（　　　）です。'), options('おいしい', 'ちかい', 'あかい', 'やさしい')),
              question(17, plain('この りんごは とても（　　　）です。'), options('あまい', 'ひろい', 'はやい', 'くらい')),
              question(18, plain('しゅくだいを（　　　）から、あそびます。'), options('たべて', 'して', 'のんで', 'きいて')),
            ],
          },
          {
            id: 'paraphrases', label: 'もんだい 4', englishLabel: 'Paraphrases',
            instructions: ['＿＿＿の ぶんと だいたい おなじ いみの ぶんは どれですか。', '1・2・3・4 から いちばん いいものを ひとつ えらんで ください。'],
            questions: [
              question(19, plain('この みちは ひろいです。'), options('この みちは せまいです。', 'この みちは おおきいです。', 'この みちは ながいです。', 'この みちは くらいです。')),
              question(20, plain('きょうは とても あついです。'), options('きょうは さむいです。', 'きょうは あたたかいです。', 'きょうは あついです。', 'きょうは すずしいです。')),
              question(21, plain('かれは はやく きました。'), options('かれは おそく きました。', 'かれは すぐ きました。', 'かれは こなかったです。', 'かれは あるいて きました。')),
            ],
          },
        ],
      },
      {
        id: 'session-2', title: '言語知識（文法）・読解', durationMinutes: 40, status: 'upcoming', groups: [],
        previewQuestion: question(22, plain('わたしは 日本（　　　） いきます。'), options('を', 'が', 'へ', 'で')),
      },
      { id: 'session-3', title: '聴解', navigationTitle: 'ちょうかい', durationMinutes: 31, status: 'upcoming', groups: [] },
    ],
  },
];
