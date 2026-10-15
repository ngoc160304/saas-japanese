'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type {
  AdminJlptExamDetail,
  AdminJlptQuestion,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAdminJlptError } from '../admin-jlpt-error';
import { adminJlptContentLock } from '../admin-jlpt-structure';
import {
  adminJlptQuestionContext,
  adminJlptQuestionSchema,
  adminJlptQuestionValues,
  adminJlptQuestionUrl,
  adminJlptBuilderUrl,
  adminJlptNextQuestion,
  adminJlptQuestionErrorPath,
  type AdminJlptQuestionTarget,
  type AdminJlptQuestionValues,
} from '../admin-jlpt-question';
import { useAdminJlptExamDetail } from '../hooks/useAdminJlptExams';
import { useAdminJlptQuestionSave } from '../hooks/useAdminJlptQuestionSave';
import { useAdminJlptQuestionExit } from '../hooks/useAdminJlptQuestionExit';
import { AdminJlptLoading, AdminJlptQueryError } from './AdminJlptState';
import { AdminJlptStatus } from './AdminJlptStatus';
import { AdminJlptQuestionFields, AdminJlptQuestionExplanation } from './AdminJlptQuestionFields';
import { AdminJlptQuestionAnswers } from './AdminJlptQuestionAnswers';

export function AdminJlptQuestionEditorPage({ target }: { target: AdminJlptQuestionTarget }) {
  return <EditorLoader key={adminJlptQuestionUrl(target)} target={target} />;
}

function EditorLoader({ target }: { target: AdminJlptQuestionTarget }) {
  const query = useAdminJlptExamDetail(target.examId, true);
  const [initial, setInitial] = useState<AdminJlptExamDetail | null>(null);
  if (!initial && query.isSuccess && query.isFetchedAfterMount) setInitial(query.data);
  if (initial) return <QuestionEditor target={target} initial={initial} query={query} />;
  if (query.isError)
    return (
      <AdminJlptQueryError
        error={query.error}
        onRetry={() => void query.refetch()}
        returnTo={adminJlptQuestionUrl(target)}
      />
    );
  return <AdminJlptLoading />;
}

type DetailQuery = ReturnType<typeof useAdminJlptExamDetail>;
function QuestionEditor({
  target,
  initial,
  query,
}: {
  target: AdminJlptQuestionTarget;
  initial: AdminJlptExamDetail;
  query: DetailQuery;
}) {
  const context = adminJlptQuestionContext(initial, target);
  if (!context)
    return (
      <PageSection>
        <h1 className="text-xl font-semibold text-slate-900">
          Không tìm thấy câu hỏi hoặc phần thi
        </h1>
        <p className="text-sm text-slate-600">
          Tài nguyên không tồn tại trong đúng đề thi, phiên thi và phần thi của đường dẫn này.
        </p>
        <Link
          href={`/admin/exams/${target.examId}`}
          className="text-sm font-semibold text-primary underline"
        >
          Về builder
        </Link>
      </PageSection>
    );
  return (
    <QuestionForm
      target={target}
      initial={initial}
      initialQuestion={context.question}
      query={query}
    />
  );
}

function QuestionForm({
  target,
  initial,
  initialQuestion,
  query,
}: {
  target: AdminJlptQuestionTarget;
  initial: AdminJlptExamDetail;
  initialQuestion?: AdminJlptQuestion;
  query: DetailQuery;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<AdminJlptQuestion | null>(null);
  const currentTarget = { ...target, questionId: saved?.id ?? target.questionId };
  const latest = query.data ?? initial;
  const context = adminJlptQuestionContext(latest, currentTarget);
  const initialContext = adminJlptQuestionContext(initial, target);
  const maximum =
    (context?.part.questions.length ?? 0) + (currentTarget.questionId === undefined ? 1 : 0);
  const form = useForm<AdminJlptQuestionValues>({
    resolver: zodResolver(
      adminJlptQuestionSchema.refine((v) => v.position <= maximum, {
        path: ['position'],
        message: `Vị trí tối đa hiện tại là ${maximum}.`,
      }),
    ),
    defaultValues: adminJlptQuestionValues(initialQuestion, initialContext?.part.questions.length),
  });
  const save = useAdminJlptQuestionSave(target.examId);
  const gate = useRef(false);
  const [pending, setPending] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [saveError, setSaveError] = useState<ReturnType<typeof getAdminJlptError> | null>(null);
  const [uncertain, setUncertain] = useState<number[] | null>(null);
  const [checked, setChecked] = useState(false);
  const [retryCreate, setRetryCreate] = useState(false);
  const [nextSaved, setNextSaved] = useState<AdminJlptQuestion | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const busy = pending || navigating;
  const exit = useAdminJlptQuestionExit(form.formState.isDirty, busy);
  const lock = adminJlptContentLock(latest);
  const status = query.isError ? getAdminJlptError(query.error).status : null;
  const denied = status === 401 || status === 403 || [401, 403].includes(saveError?.status ?? 0);
  const blocked = Boolean(lock || !context || query.isError || query.isFetching || denied);
  const canChange = () =>
    !blocked && !busy && !gate.current && uncertain === null && nextSaved === null;

  const advance = (question: AdminJlptQuestion, detail: AdminJlptExamDetail) => {
    const savedContext = adminJlptQuestionContext(detail, { ...target, questionId: question.id });
    if (!savedContext) throw new Error('Câu hỏi vừa lưu chưa có trong cấu trúc mới nhất.');
    const next = adminJlptNextQuestion(savedContext.part, question.id);
    if (target.questionId === undefined) {
      // Another creation starts with no backend IDs or selected answer.
      setSaved(null);
      setNextSaved(null);
      form.reset(adminJlptQuestionValues(undefined, savedContext.part.questions.length));
      setNotice('Đã lưu. Đang soạn câu hỏi mới trong cùng phần thi.');
      window.requestAnimationFrame(() => form.setFocus('questionText'));
    } else {
      setNavigating(true);
      router.push(adminJlptQuestionUrl({ ...target, questionId: next?.id }));
    }
  };

  const submit = async (next: boolean) => {
    if (!canChange()) return;
    gate.current = true;
    setPending(true);
    try {
      await form.handleSubmit(
        async (values) => {
          form.clearErrors();
          setSaveError(null);
          setNotice(null);
          const siblings = context?.part.questions.map((q) => q.id) ?? [];
          let outcome: Awaited<ReturnType<typeof save>>;
          try {
            outcome = await save({ target: currentTarget, values });
          } catch (cause) {
            const error = getAdminJlptError(cause);
            setSaveError(error);
            for (const [field, message] of Object.entries(error.fieldErrors)) {
              const path = adminJlptQuestionErrorPath(field, values.answers.length);
              if (path) form.setError(path, { type: 'server', message });
            }
            if (
              currentTarget.questionId === undefined &&
              (error.status === null || error.status >= 500)
            ) {
              setUncertain(siblings);
              setChecked(false);
            }
            window.requestAnimationFrame(() => errorRef.current?.focus());
            return;
          }
          const result = outcome.question;
          setSaved(result);
          form.reset(adminJlptQuestionValues(result));
          toast.success('Đã lưu câu hỏi và toàn bộ đáp án.');
          setNotice('Đã lưu câu hỏi và toàn bộ đáp án.');
          if (next) {
            // A successful write is never reclassified as failed if reconciliation fails.
            if (outcome.detail) {
              try {
                advance(result, outcome.detail);
                return;
              } catch {
                /* Keep the saved baseline. */
              }
            }
            setNextSaved(result);
            setNotice(
              'Đã lưu thành công; chưa xác minh được thứ tự mới nhất để chuyển tiếp. Tải lại để tiếp tục, không cần lưu lại.',
            );
          } else if (target.questionId === undefined) {
            setNavigating(true);
            router.replace(adminJlptQuestionUrl({ ...target, questionId: result.id }));
          }
        },
        (errors) => {
          if (errors.answers?.root || errors.answers?.message)
            window.requestAnimationFrame(() =>
              document.querySelector<HTMLInputElement>('input[name="correctAnswer"]')?.focus(),
            );
        },
      )();
    } finally {
      gate.current = false;
      setPending(false);
    }
  };

  if (denied)
    return (
      <AdminJlptQueryError
        error={query.isError ? query.error : saveError}
        onRetry={() => void query.refetch()}
        returnTo={adminJlptQuestionUrl(target)}
      />
    );
  const parent = context ?? initialContext;
  const image = context?.question
    ? context.question.image
    : (saved?.image ?? initialQuestion?.image ?? null);
  return (
    <div className="min-w-0 space-y-6">
      <Header
        title={
          currentTarget.questionId === undefined
            ? 'Thêm câu hỏi JLPT'
            : `Câu hỏi #${currentTarget.questionId}`
        }
        description="Soạn nội dung và lưu toàn bộ đáp án trong một giao dịch."
        showProfile={false}
        breadcrumbs={
          <nav
            aria-label="Đường dẫn"
            className="mb-2 flex flex-wrap gap-2 break-words text-xs text-slate-600 [overflow-wrap:anywhere]"
          >
            <Link href="/admin/exams" className="text-primary underline">
              Đề thi
            </Link>
            <span>/</span>
            <Link href={adminJlptBuilderUrl(target)} className="text-primary underline">
              {latest.title}
            </Link>
            <span>/</span>
            <span>{parent?.session.name}</span>
            <span>/</span>
            <Link href={adminJlptBuilderUrl(target)} className="text-primary underline">
              {parent?.part.name}
            </Link>
          </nav>
        }
      >
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => exit.requestExit(adminJlptBuilderUrl(target))}
        >
          Về builder
        </Button>
      </Header>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <AdminJlptStatus status={latest.status} />
        <span className="text-slate-600">
          {latest.level} · {parent?.part.name}
        </span>
      </div>
      {lock && (
        <p
          role="note"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {lock} Có thể xem nội dung bên dưới.
        </p>
      )}
      {!context && (
        <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          Tài nguyên không còn thuộc ngữ cảnh này. Biểu mẫu được giữ để đối chiếu; không thể lưu.
        </p>
      )}
      {query.isError && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-800"
        >
          <p>
            {getAdminJlptError(query.error).message} Chỉnh sửa tạm khóa; nội dung đang nhập được giữ
            lại.
          </p>
          <Button
            variant="outline"
            disabled={busy || query.isFetching}
            onClick={() => void query.refetch()}
          >
            Tải lại trạng thái, giữ biểu mẫu
          </Button>
        </div>
      )}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <p role="status" className="text-xs text-slate-600">
          {busy
            ? 'Đang lưu / chuyển trang…'
            : form.formState.isDirty
              ? 'Có thay đổi chưa lưu'
              : 'Biểu mẫu chưa có thay đổi mới'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={blocked || busy || uncertain !== null || nextSaved !== null}
            onClick={() => void submit(false)}
          >
            Lưu câu hỏi
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={blocked || busy || uncertain !== null || nextSaved !== null}
            onClick={() => void submit(true)}
          >
            Lưu & tiếp →
          </Button>
        </div>
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"
        >
          {notice}
        </p>
      )}
      {nextSaved && (
        <Button
          variant="outline"
          disabled={busy || query.isFetching}
          onClick={async () => {
            const refreshed = await query.refetch();
            if (refreshed.isSuccess) {
              try {
                advance(nextSaved, refreshed.data);
              } catch {
                setNotice(
                  'Đã lưu, nhưng câu hỏi không còn trong cấu trúc hiện tại. Hãy kiểm tra builder.',
                );
              }
            }
          }}
        >
          Tải thứ tự mới nhất và tiếp tục
        </Button>
      )}
      {saveError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 outline-none focus:ring-2 focus:ring-rose-500"
        >
          <p>{saveError.message}</p>
          <p>
            {saveError.status === 409 || saveError.status === 404
              ? 'Trạng thái hoặc quan hệ dữ liệu có thể đã thay đổi. Đã yêu cầu tải lại; nội dung nhập vẫn được giữ.'
              : 'Nội dung nhập vẫn được giữ để kiểm tra và sửa.'}
          </p>
          {Object.entries(saveError.fieldErrors)
            .filter(
              ([field]) => !adminJlptQuestionErrorPath(field, form.getValues('answers').length),
            )
            .map(([field, message]) => (
              <p key={field}>{message}</p>
            ))}
        </div>
      )}
      {uncertain !== null && (
        <PageSection>
          <h2 className="text-lg font-semibold text-amber-900">
            Chưa xác nhận được kết quả tạo câu hỏi
          </h2>
          <p className="text-sm text-slate-700">
            Máy chủ có thể đã lưu dù không nhận được phản hồi. Không tự gửi lại. Tải cấu trúc và đối
            chiếu trong tab mới trước khi quyết định; request cũ có thể vẫn đang hoàn tất.
          </p>
          <Button
            variant="outline"
            disabled={query.isFetching || busy}
            onClick={async () => {
              setChecked(false);
              const refreshed = await query.refetch();
              if (refreshed.isSuccess) setChecked(true);
            }}
          >
            Kiểm tra dữ liệu đã lưu
          </Button>
          {checked && (
            <div className="space-y-2 text-sm text-slate-700">
              <p>Câu hỏi mới so với trước lần gửi (cần tự đối chiếu nội dung):</p>
              {context?.part.questions
                .filter((q) => !uncertain.includes(q.id))
                .map((q) => (
                  <p key={q.id}>
                    <Link
                      href={adminJlptQuestionUrl({ ...target, questionId: q.id })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary underline"
                    >
                      Mở câu hỏi #{q.id} trong tab mới
                    </Link>
                  </p>
                ))}
              {!context?.part.questions.some((q) => !uncertain.includes(q.id)) && (
                <p>
                  Chưa thấy câu hỏi mới trong lần tải này. Điều này không đảm bảo request cũ chưa
                  được lưu.
                </p>
              )}
              <Button variant="outline" disabled={blocked} onClick={() => setRetryCreate(true)}>
                Đã đối chiếu, xem lựa chọn gửi lại
              </Button>
            </div>
          )}
        </PageSection>
      )}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit(false);
        }}
      >
        <fieldset
          disabled={blocked || busy || uncertain !== null || nextSaved !== null}
          className="min-w-0 space-y-6"
        >
          <legend className="sr-only">Nội dung câu hỏi trắc nghiệm</legend>
          <AdminJlptQuestionFields form={form} maximum={maximum} image={image} />
          <AdminJlptQuestionAnswers
            form={form}
            disabled={blocked || busy || uncertain !== null || nextSaved !== null}
            canChange={canChange}
          />
          <AdminJlptQuestionExplanation form={form} />
        </fieldset>
      </form>
      <AlertDialog
        open={exit.destination !== null}
        onOpenChange={(open) => {
          if (!open) exit.cancel();
        }}
      >
        <AlertDialogContent className="bg-white text-slate-900">
          <AlertDialogTitle>Bỏ thay đổi chưa lưu?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Nội dung đang nhập sẽ bị mất nếu rời editor.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
            <Button variant="destructive" onClick={exit.discard}>
              Bỏ thay đổi và rời trang
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={retryCreate} onOpenChange={setRetryCreate}>
        <AlertDialogContent className="bg-white text-slate-900">
          <AlertDialogTitle>Cho phép một lần tạo mới?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Chỉ tiếp tục nếu đã kiểm tra và chưa có câu hỏi tương ứng. Gửi lại có thể tạo bản trùng
            vì API chưa có khóa idempotency. Thao tác này chỉ mở khóa nút lưu, chưa gửi request.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Giữ biểu mẫu</AlertDialogCancel>
            <Button
              onClick={() => {
                setUncertain(null);
                setRetryCreate(false);
                setSaveError(null);
              }}
            >
              Tôi đã kiểm tra, mở khóa lưu
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
