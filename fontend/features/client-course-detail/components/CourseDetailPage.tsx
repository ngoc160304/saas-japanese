import { MOCK_COURSE_DETAIL } from '../course-detail.mock';
import { CourseDetailHero } from './CourseDetailHero';
import { CourseInstructor } from './CourseInstructor';
import { CourseLearningOutcomes } from './CourseLearningOutcomes';
import { CoursePurchaseCard } from './CoursePurchaseCard';
import { CourseSyllabus } from './CourseSyllabus';

export function CourseDetailPage({ courseId }: { courseId: number }) {
  const course = MOCK_COURSE_DETAIL;

  return (
    <>
      <CourseDetailHero course={course} routeCourseId={courseId} />
      <main className="relative z-10 mx-auto -mt-6 mb-16 w-full max-w-6xl px-4 sm:px-6 lg:-mt-10 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-3">
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-2">
            <CourseLearningOutcomes outcomes={course.outcomes} />
            <CourseSyllabus syllabus={course.syllabus} />
            <section className="shadow-soft rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="mb-4 text-lg font-bold text-slate-800 sm:text-xl">Yêu cầu khóa học</h2>
              <ul className="list-inside list-disc space-y-2.5 text-sm text-slate-600">
                {course.requirements.map((requirement) => (
                  <li key={requirement.id}>{requirement.label}</li>
                ))}
              </ul>
            </section>
            <CourseInstructor instructor={course.instructor} />
          </div>
          <div className="order-1 lg:sticky lg:top-24 lg:order-2">
            <CoursePurchaseCard course={course} />
          </div>
        </div>
      </main>
    </>
  );
}
