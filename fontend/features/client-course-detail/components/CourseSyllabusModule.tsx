import { ChevronDown, CircleHelp, CirclePlay, FileText } from 'lucide-react';
import type {
  CourseDetailLesson,
  CourseDetailModule,
  CourseLessonKind,
} from '../course-detail.types';

const lessonIcons: Record<CourseLessonKind, typeof CirclePlay> = {
  video: CirclePlay,
  resource: FileText,
  quiz: CircleHelp,
};

function CourseLessonRow({ lesson }: { lesson: CourseDetailLesson }) {
  const LessonIcon = lessonIcons[lesson.kind];
  const iconColor =
    lesson.kind === 'quiz'
      ? 'text-amber-500'
      : lesson.kind === 'resource'
        ? 'text-slate-400'
        : 'text-brand-navy';

  return (
    <li className="flex items-center justify-between gap-4 p-3.5 hover:bg-slate-50/50 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <LessonIcon className={`h-4 w-4 shrink-0 ${iconColor}`} aria-hidden="true" />
        <span className="text-xs font-medium text-slate-700 sm:text-sm">{lesson.title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
        {lesson.preview && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-brand-blue">
            Học thử
          </span>
        )}
        <span>{lesson.meta}</span>
      </div>
    </li>
  );
}

interface CourseSyllabusModuleProps {
  module: CourseDetailModule;
  expanded: boolean;
  onToggle: () => void;
}

export function CourseSyllabusModule({ module, expanded, onToggle }: CourseSyllabusModuleProps) {
  const headerId = `${module.id}-header`;
  const contentId = `${module.id}-content`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h3>
        <button
          id={headerId}
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 bg-slate-50/80 p-4 text-left transition-colors hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue"
        >
          <span className="flex min-w-0 items-center gap-3">
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-slate-800">{module.title}</span>
          </span>
          <span className="ml-2 shrink-0 text-xs font-medium text-slate-500">
            {module.lessonCount} bài • {module.duration}
          </span>
        </button>
      </h3>
      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        hidden={!expanded}
        className="border-t border-slate-200/80"
      >
        <ul className="divide-y divide-slate-100 text-sm">
          {module.lessons.map((lesson) => (
            <CourseLessonRow key={lesson.id} lesson={lesson} />
          ))}
        </ul>
      </div>
    </div>
  );
}
