import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { EnrolledCourse } from '../types';

const levelTones: Record<string, string> = {
  sky: 'bg-sky-600',
  navy: 'bg-slate-900',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
};

export function EnrolledCoursesTable({ courses }: { courses: EnrolledCourse[] }) {
  return (
    <Card className="shadow-soft gap-0 rounded-3xl border-slate-100 bg-white p-5 md:p-6">
      <section aria-labelledby="enrolled-courses-heading">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              id="enrolled-courses-heading"
              className="text-base font-bold text-slate-900 md:text-lg"
            >
              Your Enrolled Courses
            </h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              JLPT programs &amp; courses where you&apos;re actively learning
            </p>
          </div>
          <MoreHorizontal className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <th className="pb-3 pl-2 font-semibold">Course Name</th>
                <th className="px-4 pb-3 font-semibold">Learners</th>
                <th className="px-4 pb-3 font-semibold">Enrolled Date</th>
                <th className="pr-2 pb-3 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-xs">
              {courses.map((course) => (
                <tr key={course.id} className="group transition-colors hover:bg-slate-50/70">
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ${levelTones[course.tone] ?? levelTones.sky}`}
                      >
                        {course.level}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 transition-colors group-hover:text-sky-600 md:text-sm">
                          {course.title}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400">{course.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center -space-x-1.5">
                      {course.learnerAvatars.map((avatar, index) => (
                        <Image
                          key={`${course.id}-${index}`}
                          src={avatar}
                          alt={`Learner ${index + 1}`}
                          width={24}
                          height={24}
                          className="h-6 w-6 rounded-full object-cover ring-2 ring-white"
                        />
                      ))}
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white">
                        +{course.additionalLearners}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium whitespace-nowrap text-slate-500">
                    {course.enrolledDate}
                  </td>
                  <td className="py-3.5 pr-2">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 md:w-32">
                        <div
                          className={`h-full rounded-full ${course.tone === 'emerald' ? 'bg-emerald-500' : 'bg-sky-500'}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs font-bold text-slate-700">
                        {course.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Card>
  );
}
