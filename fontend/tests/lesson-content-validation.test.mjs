import assert from 'node:assert/strict';
import test from 'node:test';
import { vocabularySchema, kanjiSchema } from '../features/lesson/schemas/lesson-content.schema.ts';

const vocabulary = {
  word: ' コーヒー / coffee! ',
  reading: ' こーひー ',
  meaningVi: ' Cà phê ',
  partOfSpeech: 'tự do',
  exampleSentenceJp: ' 一行\n  二行 ',
  exampleSentenceVi: '',
};
const kanji = {
  kanji: '𠮷',
  meaningVi: 'Tốt',
  onyomi: 'キチ、キツ',
  kunyomi: 'よ.い',
  exampleWords: '吉日: ngày tốt',
  strokeCount: null,
};

test('vocabulary allows kana/Latin/punctuation, free taxonomy and preserves interior formatting', () => {
  const value = vocabularySchema.parse(vocabulary);
  assert.equal(value.word, 'コーヒー / coffee!');
  assert.equal(value.exampleSentenceJp, '一行\n  二行');
  assert.equal(value.partOfSpeech, 'tự do');
  assert.equal(value.exampleSentenceVi, '');
});

test('vocabulary matches required fields and storage lengths', () => {
  for (const field of ['word', 'reading', 'meaningVi'])
    assert.equal(vocabularySchema.safeParse({ ...vocabulary, [field]: '  ' }).success, false);
  for (const [field, limit] of Object.entries({
    word: 100,
    reading: 150,
    meaningVi: 500,
    partOfSpeech: 50,
    exampleSentenceJp: 1000,
    exampleSentenceVi: 1000,
  })) {
    assert.equal(
      vocabularySchema.safeParse({ ...vocabulary, [field]: 'x'.repeat(limit) }).success,
      true,
    );
    assert.equal(
      vocabularySchema.safeParse({ ...vocabulary, [field]: 'x'.repeat(limit + 1) }).success,
      false,
    );
  }
});

test('Kanji keeps Unicode and reading/example text; strokeCount is null or positive Java integer', () => {
  assert.deepEqual(kanjiSchema.parse(kanji), kanji);
  for (const strokeCount of [0, -1, 1.5, NaN, Infinity, 2147483648])
    assert.equal(kanjiSchema.safeParse({ ...kanji, strokeCount }).success, false);
  for (const strokeCount of [null, 1, 2147483647])
    assert.equal(kanjiSchema.safeParse({ ...kanji, strokeCount }).success, true);
  for (const [field, limit] of Object.entries({
    kanji: 10,
    meaningVi: 255,
    onyomi: 150,
    kunyomi: 150,
    exampleWords: 1000,
  })) {
    assert.equal(kanjiSchema.safeParse({ ...kanji, [field]: 'x'.repeat(limit) }).success, true);
    assert.equal(
      kanjiSchema.safeParse({ ...kanji, [field]: 'x'.repeat(limit + 1) }).success,
      false,
    );
  }
});
