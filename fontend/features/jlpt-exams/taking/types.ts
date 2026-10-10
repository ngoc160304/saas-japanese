export interface ExamAnswerOption {
  id: 1 | 2 | 3 | 4;
  text: string;
}

export interface QuestionTextSegment {
  text: string;
  underlined?: boolean;
}

export interface ExamQuestion {
  id: string;
  number: number;
  text: QuestionTextSegment[];
  options: [ExamAnswerOption, ExamAnswerOption, ExamAnswerOption, ExamAnswerOption];
}

export interface ExamQuestionGroup {
  id: string;
  label: string;
  englishLabel: string;
  instructions: [string, string];
  questions: ExamQuestion[];
}

export interface ExamSection {
  id: string;
  title: string;
  navigationTitle?: string;
  durationMinutes: number;
  status: 'active' | 'upcoming';
  groups: ExamQuestionGroup[];
  previewQuestion?: ExamQuestion;
}

export interface ExamTakingMock {
  id: string;
  title: string;
  sections: [ExamSection, ExamSection, ExamSection];
  breakMinutes: number;
}
