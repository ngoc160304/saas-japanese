import Link from 'next/link';
import { JlptExamTakingPage as TakingPageContent } from '@/features/jlpt-exams/components/taking/JlptExamTakingPage';

function InvalidTakingLink({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f8fafc] p-4">
      <section role="alert" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900">Invalid exam link</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <Link href="/student/jlpt-exams" className="mt-5 inline-block text-sm font-bold text-sky-700 hover:underline">Browse JLPT exams</Link>
      </section>
    </main>
  );
}

export default async function JlptExamTakingPage({ params, searchParams }: PageProps<'/jlpt-exams/[id]/taking'>) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) return <InvalidTakingLink message="The exam ID must be a positive number." />;
  const examId = Number(id);
  if (!Number.isSafeInteger(examId)) return <InvalidTakingLink message="The exam ID is out of range." />;

  const query = await searchParams;
  if (query.mode !== 'full' && query.mode !== 'session') {
    return <InvalidTakingLink message="Choose full exam or an individual session from the exam detail page." />;
  }
  if (query.mode === 'full') {
    if (query.sessionId !== undefined || query.session_id !== undefined) return <InvalidTakingLink message="A full exam link must not include a session ID." />;
    return <TakingPageContent examId={examId} mode="full" />;
  }

  if (query.sessionId !== undefined && query.session_id !== undefined) return <InvalidTakingLink message="Provide only one session ID." />;
  const sessionIdValue = query.sessionId ?? query.session_id;
  if (typeof sessionIdValue !== 'string' || !/^[1-9]\d*$/.test(sessionIdValue) || !Number.isSafeInteger(Number(sessionIdValue))) {
    return <InvalidTakingLink message="Session practice requires a valid numeric session ID." />;
  }

  return <TakingPageContent examId={examId} mode="session" sessionId={Number(sessionIdValue)} />;
}
