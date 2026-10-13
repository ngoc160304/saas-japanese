import { z } from 'zod';

const requiredText = (max: number) =>
  z.string().trim().min(1, 'Không được để trống.').max(max, `Tối đa ${max} ký tự.`);
const optionalText = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự.`);

export const vocabularySchema = z.object({
  word: requiredText(100),
  reading: requiredText(150),
  meaningVi: requiredText(500),
  partOfSpeech: optionalText(50),
  exampleSentenceJp: optionalText(1000),
  exampleSentenceVi: optionalText(1000),
});

export const kanjiSchema = z.object({
  kanji: requiredText(10),
  onyomi: optionalText(150),
  kunyomi: optionalText(150),
  meaningVi: requiredText(255),
  strokeCount: z
    .number({ error: 'Nhập số nét hợp lệ.' })
    .int('Số nét phải là số nguyên.')
    .min(1, 'Số nét phải lớn hơn 0.')
    .max(2147483647, 'Số nét quá lớn.')
    .nullable(),
  exampleWords: optionalText(1000),
});

export type VocabularyValues = z.infer<typeof vocabularySchema>;
export type KanjiValues = z.infer<typeof kanjiSchema>;
