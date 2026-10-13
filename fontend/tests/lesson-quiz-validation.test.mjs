import assert from 'node:assert/strict';
import test from 'node:test';
import {
  quizMetadataSchema,
  quizQuestionSchema,
  questionInput,
} from '../features/lesson/schemas/quiz.schema.ts';

const values = {
  questionText: '  学校の読み方は？  ',
  options: [
    { persistedId: 12, optionText: ' がっこう ', isCorrect: true },
    { persistedId: null, optionText: 'がくせい', isCorrect: false },
  ],
};
test('metadata follows actual title/description limits and empty description contract', () => {
  assert.deepEqual(quizMetadataSchema.parse({ title: ' Quiz ', description: '' }), {
    title: 'Quiz',
    description: '',
  });
  for (const title of ['', '  ', 'x'.repeat(201)])
    assert.equal(quizMetadataSchema.safeParse({ title, description: '' }).success, false);
  assert.equal(
    quizMetadataSchema.safeParse({ title: 'Quiz', description: 'x'.repeat(501) }).success,
    false,
  );
});
test('question validation rejects blank, overlong, missing and multiple correct answers', () => {
  const parse = (data) => quizQuestionSchema.safeParse(data).success;
  assert.equal(parse(values), true);
  assert.equal(parse({ ...values, questionText: '日'.repeat(21846) }), false);
  assert.equal(parse({ ...values, questionText: '日'.repeat(21845) }), true);
  for (const options of [
    [],
    [values.options[0]],
    values.options.map((o) => ({ ...o, isCorrect: false })),
    values.options.map((o) => ({ ...o, isCorrect: true })),
    values.options.map((o) => ({ ...o, optionText: ' ' })),
    values.options.map((o) => ({ ...o, optionText: 'x'.repeat(501) })),
  ])
    assert.equal(parse({ ...values, options }), false);
});
test('payload keeps persisted IDs, never sends temporary form IDs, and keeps order', () => {
  const parsed = quizQuestionSchema.parse(values);
  assert.deepEqual(questionInput(parsed), {
    questionText: '学校の読み方は？',
    questionType: 'SINGLE_CHOICE',
    options: [
      { id: 12, optionText: 'がっこう', isCorrect: true },
      { optionText: 'がくせい', isCorrect: false },
    ],
  });
  const removedCorrect = {
    ...values,
    options: [values.options[1], { persistedId: null, optionText: 'New', isCorrect: false }],
  };
  assert.equal(quizQuestionSchema.safeParse(removedCorrect).success, false);
});
