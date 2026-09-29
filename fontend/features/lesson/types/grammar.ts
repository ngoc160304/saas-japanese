export interface GrammarPoint {
  id: string;
  title: string;
  explanation: string;
  editorContent: string;
}

export interface GrammarLectureVideo {
  fileName: string;
  duration: string;
  url: string;
}

export interface LessonGrammarPreview {
  courseTitle: string;
  title: string;
  durationMinutes: number;
  video: GrammarLectureVideo;
  points: readonly GrammarPoint[];
}
