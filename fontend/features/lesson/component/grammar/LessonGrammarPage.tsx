import { lessonGrammarMock } from '../../data/grammar.mock';
import { lessonVocabularyMock } from '../../data/vocabulary.mock';
import { LessonContentWorkspace } from '../LessonContentWorkspace';

export function LessonGrammarPage({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  return (
    <LessonContentWorkspace
      key={`${courseId}-${lessonId}`}
      courseId={courseId}
      lessonId={lessonId}
      lesson={lessonGrammarMock}
      vocabularyItems={lessonVocabularyMock}
    />
  );
}
