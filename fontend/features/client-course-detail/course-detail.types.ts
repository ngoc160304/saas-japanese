export type CourseLessonKind = 'video' | 'resource' | 'quiz';

export interface CourseDetailLesson {
  id: string;
  title: string;
  kind: CourseLessonKind;
  meta: string;
  preview?: boolean;
}

export interface CourseDetailModule {
  id: string;
  title: string;
  lessonCount: number;
  duration: string;
  lessons: CourseDetailLesson[];
}

export interface CourseDetailInstructorData {
  name: string;
  role: string;
  biography: string;
  initials: string;
}

export type CourseBenefitIcon = 'video' | 'document' | 'exam' | 'lifetime' | 'devices';

export interface CourseDetailBenefit {
  id: string;
  label: string;
  icon: CourseBenefitIcon;
}

export interface CourseDetailData {
  id: string;
  level: string;
  badge: string;
  title: string;
  description: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
  updatedAt: string;
  languages: string;
  thumbnailUrl: string | null;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  outcomes: ReadonlyArray<{ id: string; label: string }>;
  syllabus: {
    moduleCount: number;
    lessonCount: number;
    duration: string;
    modules: ReadonlyArray<CourseDetailModule>;
  };
  requirements: ReadonlyArray<{ id: string; label: string }>;
  instructor: CourseDetailInstructorData;
  benefits: ReadonlyArray<CourseDetailBenefit>;
}
