import type { JlptAttemptReview } from './types';

export function getMockAttemptReview(attemptId: number): JlptAttemptReview {
  return {
    attemptId,
    examId: 5,
    examTitle: 'JLPT N5 Practice Exam',
    jlptLevel: 'N5',
    status: 'completed',
    sessions: [
      {
        sessionId: 11,
        sessionTitle: 'Language Knowledge',
        sessionOrder: 1,
        parts: [
          {
            partId: 101,
            partName: 'もんだい 1: Kanji Reading (漢字読み)',
            partOrder: 1,
            questions: [
              {
                questionId: 1001,
                questionOrder: 1,
                questionText: 'およいで 川 を わたりました。川 は どう よみますか。',
                passageText: null,
                selectedAnswerId: 102,
                correctAnswerId: 102,
                isCorrect: true,
                answers: [
                  { answerId: 101, answerText: 'はし' },
                  { answerId: 102, answerText: 'かわ' },
                  { answerId: 103, answerText: 'そら' },
                  { answerId: 104, answerText: 'みち' },
                ],
                explanation: '川 (かわ) means river. はし means bridge; そら means sky; みち means road.',
              },
              {
                questionId: 1002,
                questionOrder: 2,
                questionText: 'あした 学校 に いきます。学校 は どう よみますか。',
                passageText: null,
                selectedAnswerId: 202,
                correctAnswerId: 203,
                isCorrect: false,
                answers: [
                  { answerId: 201, answerText: 'がくせい' },
                  { answerId: 202, answerText: 'かいしゃ' },
                  { answerId: 203, answerText: 'がっこう' },
                  { answerId: 204, answerText: 'としょかん' },
                ],
                explanation: '学校 is read がっこう and means school. かいしゃ means company.',
              },
            ],
          },
          {
            partId: 102,
            partName: 'もんだい 2: Grammar',
            partOrder: 2,
            questions: [
              {
                questionId: 1003,
                questionOrder: 1,
                questionText: 'わたしは あした ともだち（　）あいます。',
                passageText: 'あしたは 日曜日です。わたしは ともだちと えきで あいます。',
                selectedAnswerId: 302,
                correctAnswerId: 302,
                isCorrect: true,
                answers: [
                  { answerId: 301, answerText: 'を' },
                  { answerId: 302, answerText: 'と' },
                  { answerId: 303, answerText: 'に' },
                  { answerId: 304, answerText: 'で' },
                ],
                explanation: 'と marks the person you meet with in this sentence: ともだちと あいます.',
              },
              {
                questionId: 1004,
                questionOrder: 2,
                questionText: 'この ほんは（　）です。',
                passageText: null,
                selectedAnswerId: null,
                correctAnswerId: 401,
                isCorrect: false,
                answers: [
                  { answerId: 401, answerText: 'おもしろい' },
                  { answerId: 402, answerText: 'おもしろく' },
                  { answerId: 403, answerText: 'おもしろさ' },
                  { answerId: 404, answerText: 'おもしろくて' },
                ],
                explanation: 'An い-adjective can directly precede です. おもしろいです means “is interesting.”',
              },
            ],
          },
        ],
      },
      {
        sessionId: 12,
        sessionTitle: 'Reading',
        sessionOrder: 2,
        parts: [
          {
            partId: 103,
            partName: 'もんだい 3: Short Passage',
            partOrder: 1,
            questions: [
              {
                questionId: 1005,
                questionOrder: 1,
                questionText: 'たなかさんは いつ スーパーへ いきますか。',
                passageText: 'たなかさんは 土曜日の あさ スーパーへ いきます。日曜日は うちで べんきょうします。',
                selectedAnswerId: 502,
                correctAnswerId: 501,
                isCorrect: false,
                answers: [
                  { answerId: 501, answerText: '土曜日の あさ' },
                  { answerId: 502, answerText: '日曜日の あさ' },
                  { answerId: 503, answerText: '土曜日の よる' },
                  { answerId: 504, answerText: '日曜日の よる' },
                ],
                explanation: 'The first sentence says that Tanaka goes to the supermarket on Saturday morning.',
              },
              {
                questionId: 1006,
                questionOrder: 2,
                questionText: '日曜日に たなかさんは なにを しますか。',
                passageText: 'たなかさんは 土曜日の あさ スーパーへ いきます。日曜日は うちで べんきょうします。',
                selectedAnswerId: null,
                correctAnswerId: 603,
                isCorrect: false,
                answers: [
                  { answerId: 601, answerText: 'スーパーへ いきます' },
                  { answerId: 602, answerText: 'ともだちに あいます' },
                  { answerId: 603, answerText: 'うちで べんきょうします' },
                  { answerId: 604, answerText: 'えきへ いきます' },
                ],
                explanation: 'The second sentence says that Tanaka studies at home on Sunday.',
              },
            ],
          },
        ],
      },
    ],
  };
}
