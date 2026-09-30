import type { CourseDetailInstructorData } from '../course-detail.types';

export function CourseInstructor({ instructor }: { instructor: CourseDetailInstructorData }) {
  return (
    <section className="shadow-soft rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="mb-5 text-lg font-bold text-slate-800 sm:text-xl">Giảng viên hướng dẫn</h2>
      <div className="flex flex-col items-start gap-5 sm:flex-row">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-brand-navy/20 bg-brand-navy/10 text-xl font-extrabold text-brand-navy"
          aria-hidden="true"
        >
          {instructor.initials}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">{instructor.name}</h3>
          <p className="mb-3 text-xs font-semibold text-brand-blue">{instructor.role}</p>
          <p className="text-sm leading-relaxed font-normal text-slate-600">
            {instructor.biography}
          </p>
        </div>
      </div>
    </section>
  );
}
