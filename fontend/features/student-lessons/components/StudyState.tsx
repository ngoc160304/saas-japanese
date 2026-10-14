import Link from 'next/link';
import { getApiError } from '@/lib/api-error';

export const studyButtonClass =
  'rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50';
export const studyLinkClass =
  'rounded-md font-semibold text-sky-700 hover:text-sky-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500';

export function StudyLoading({ label = 'Loading lesson…' }: { label?: string }) {
  return (
    <p role="status" className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
      {label}
    </p>
  );
}

export function StudyError({
  error,
  onRetry,
  courseId,
  label = 'Could not load this section',
}: {
  error: unknown;
  onRetry: () => void;
  courseId?: number;
  label?: string;
}) {
  const { status } = getApiError(error);
  const title =
    status === 401
      ? 'Your session has expired'
      : status === 403
        ? 'Enrollment required'
        : status === 404
          ? 'Content unavailable'
          : label;
  const description =
    status === 401
      ? 'Sign in again to continue studying.'
      : status === 403
        ? 'Return to the course to enroll or complete checkout.'
        : status === 404
          ? 'This content may have been removed or is not published.'
          : 'Check your connection and try again. Other available lesson sections can still be used.';
  return (
    <div
      role="alert"
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm"
    >
      <h2 className="font-bold text-slate-900">{title}</h2>
      <p className="text-slate-600">{description}</p>
      <div className="flex flex-wrap items-center gap-4">
        {status !== 401 && (
          <button type="button" onClick={onRetry} className={studyButtonClass}>
            Retry
          </button>
        )}
        {status === 401 && (
          <Link href="/login" className={studyLinkClass}>
            Sign in
          </Link>
        )}
        {courseId !== undefined && (
          <Link href={`/student/courses/${courseId}`} className={studyLinkClass}>
            Back to course
          </Link>
        )}
      </div>
    </div>
  );
}
