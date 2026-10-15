'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronDown, Pencil, Plus, Trash2, Headphones } from 'lucide-react';
import type {
  AdminJlptExamDetail,
  AdminJlptQuestion,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  adminJlptSessionLabels,
  type AdminJlptEditorTarget,
  type AdminJlptStructureTarget,
} from '../admin-jlpt-structure';
import { AdminJlptSafeText } from './AdminJlptSafeText';
import { AdminJlptMediaPreview } from './AdminJlptMediaPreview';
import { adminJlptQuestionUrl } from '../admin-jlpt-question';

interface Props {
  exam: AdminJlptExamDetail;
  disabled: boolean;
  questionNavigationDisabled?: boolean;
  onEdit: (target: AdminJlptEditorTarget) => void;
  onDelete: (target: AdminJlptStructureTarget) => void;
  onMove: (target: AdminJlptStructureTarget, direction: -1 | 1) => void;
}

function OrderControls({
  label,
  index,
  count,
  disabled,
  onMove,
}: {
  label: string;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label={`Thứ tự ${label}`}>
      {([-1, 1] as const).map((direction) => {
        const blocked = disabled || (direction === -1 ? index === 0 : index === count - 1);
        const Icon = direction === -1 ? ArrowUp : ArrowDown;
        // Keep a moved button focusable, including when it reaches a boundary.
        return (
          <Button
            key={direction}
            size="icon"
            variant="outline"
            aria-label={`${direction === -1 ? 'Chuyển lên' : 'Chuyển xuống'} ${label}`}
            aria-disabled={blocked}
            className="bg-white text-slate-700 aria-disabled:cursor-not-allowed aria-disabled:text-slate-400"
            onClick={() => {
              if (!blocked) onMove(direction);
            }}
          >
            <Icon />
          </Button>
        );
      })}
    </div>
  );
}

export function AdminJlptStructureTree({
  exam,
  disabled,
  questionNavigationDisabled = false,
  onEdit,
  onDelete,
  onMove,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const revealedHash = useRef<string | null>(null);
  useEffect(() => {
    const revealContext = () => {
      if (revealedHash.current === window.location.hash) return;
      const partId = /^#part-(\d+)$/.exec(window.location.hash)?.[1];
      const session = exam.sessions.find((s) => s.parts.some((p) => String(p.id) === partId));
      if (!partId) revealedHash.current = window.location.hash;
      if (!session || !partId) return;
      revealedHash.current = window.location.hash;
      setCollapsed((previous) => {
        if (!previous.has(`session-${session.id}`) && !previous.has(`part-${partId}`)) return previous;
        const next = new Set(previous);
        next.delete(`session-${session.id}`);
        next.delete(`part-${partId}`);
        return next;
      });
    };
    revealContext();
    window.addEventListener('hashchange', revealContext);
    return () => window.removeEventListener('hashchange', revealContext);
  }, [exam.sessions]);
  const keys = exam.sessions.flatMap((s) => [
    `session-${s.id}`,
    ...s.parts.map((p) => `part-${p.id}`),
  ]);
  const allCollapsed = keys.length > 0 && keys.every((key) => collapsed.has(key));
  const toggle = (key: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const actions = (target: AdminJlptStructureTarget, label: string) => (
    <>
      {target.kind !== 'question' && (
        <Button
          size="icon"
          variant="outline"
          disabled={disabled}
          aria-label={`Sửa ${label}`}
          onClick={() => onEdit(target)}
        >
          <Pencil />
        </Button>
      )}
      <Button
        size="icon"
        variant="outline"
        disabled={disabled}
        className="text-rose-700 hover:bg-rose-50"
        aria-label={`Xóa ${label}`}
        onClick={() => onDelete(target)}
      >
        <Trash2 />
      </Button>
    </>
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-600">Đề thi → Phiên thi → Phần thi → Câu hỏi</p>
        {keys.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(keys))}
          >
            {allCollapsed ? 'Mở tất cả' : 'Thu gọn tất cả'}
          </Button>
        )}
      </div>
      {exam.sessions.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="mb-3 text-sm text-slate-600">Đề thi chưa có phiên thi.</p>
          {!disabled && (
            <Button onClick={() => onEdit({ kind: 'session' })}>
              <Plus />
              Thêm phiên thi đầu tiên
            </Button>
          )}
        </div>
      )}
      {exam.sessions.map((session, sessionIndex) => {
        const key = `session-${session.id}`,
          open = !collapsed.has(key);
        const target = { kind: 'session', sessionId: session.id } as const;
        const label = `phiên thi ${session.name}`;
        return (
          <section
            key={session.id}
            data-session-id={session.id}
            className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"
          >
            <div className="flex flex-col justify-between gap-4 bg-slate-50 p-4 md:p-5 xl:flex-row xl:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`${open ? 'Thu gọn' : 'Mở'} ${label}`}
                  aria-expanded={open}
                  aria-controls={`${key}-body`}
                  onClick={() => toggle(key)}
                >
                  <ChevronDown className={open ? '' : '-rotate-90'} />
                </Button>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-semibold text-slate-600">
                    Phiên {session.sortOrder + 1} · {session.timeLimitMinutes} phút ·{' '}
                    {session.parts.length} phần ·{' '}
                    {session.parts.reduce((n, p) => n + p.questions.length, 0)} câu hỏi
                  </p>
                  <h3 className="break-words font-semibold text-slate-900 [overflow-wrap:anywhere]">
                    {session.name}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {adminJlptSessionLabels[session.sessionType]}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <OrderControls
                  label={label}
                  index={sessionIndex}
                  count={exam.sessions.length}
                  disabled={disabled}
                  onMove={(direction) => onMove(target, direction)}
                />
                <Button
                  variant="outline"
                  disabled={disabled}
                  onClick={() => onEdit({ kind: 'part', sessionId: session.id })}
                >
                  <Plus />
                  Thêm phần thi
                </Button>
                {actions(target, label)}
              </div>
            </div>
            <div
              id={`${key}-body`}
              hidden={!open}
              className="space-y-4 border-t border-slate-200 p-3 md:p-5"
            >
              {session.parts.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-600">
                  Phiên thi chưa có phần thi.
                  {!disabled && ' Dùng nút Thêm phần thi ở trên để bắt đầu.'}
                </p>
              )}
              {session.parts.map((part, partIndex) => {
                const partKey = `part-${part.id}`,
                  partOpen = !collapsed.has(partKey);
                const partTarget = {
                  kind: 'part',
                  sessionId: session.id,
                  partId: part.id,
                } as const;
                const partLabel = `phần thi ${part.name}`;
                return (
                  <section
                    key={part.id}
                    id={`part-${part.id}`}
                    data-part-id={part.id}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 md:p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`${partOpen ? 'Thu gọn' : 'Mở'} ${partLabel}`}
                          aria-expanded={partOpen}
                          aria-controls={`${partKey}-body`}
                          onClick={() => toggle(partKey)}
                        >
                          <ChevronDown className={partOpen ? '' : '-rotate-90'} />
                        </Button>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <h4 className="break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
                            {part.sortOrder + 1}. {part.name}
                          </h4>
                          <p className="text-xs font-medium text-indigo-700">
                            {part.questions.length} câu hỏi
                          </p>
                          {part.audio && (
                            <p className="flex items-start gap-1 break-words text-xs text-emerald-800 [overflow-wrap:anywhere]">
                              <Headphones className="size-4 shrink-0" />
                              Audio: {part.audio.originalName} (#{part.audio.id})
                            </p>
                          )}
                          {part.instructions && (
                            <AdminJlptSafeText
                              text={part.instructions}
                              className="text-xs text-slate-600"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {!disabled && (
                          <Link
                            className={buttonVariants({ variant: 'outline' })}
                            href={adminJlptQuestionUrl({ examId: exam.id, sessionId: session.id, partId: part.id })}
                          >
                            <Plus />
                            Thêm câu hỏi
                          </Link>
                        )}
                        <OrderControls
                          label={partLabel}
                          index={partIndex}
                          count={session.parts.length}
                          disabled={disabled}
                          onMove={(direction) => onMove(partTarget, direction)}
                        />
                        {actions(partTarget, partLabel)}
                      </div>
                    </div>
                    <div
                      id={`${partKey}-body`}
                      hidden={!partOpen}
                      className="mt-4 space-y-3 border-t border-slate-200 pt-4"
                    >
                      {partOpen && part.audio && <AdminJlptMediaPreview kind="audio" url={part.audio.secureUrl} name={part.audio.originalName} />}
                      {part.questions.length === 0 && (
                        <p className="py-3 text-center text-sm text-slate-600">
                          Phần thi chưa có câu hỏi.
                        </p>
                      )}
                      {part.questions.map((question, index) => {
                        const questionTarget = {
                          kind: 'question',
                          sessionId: session.id,
                          partId: part.id,
                          questionId: question.id,
                        } as const;
                        const questionLabel = `câu hỏi #${question.id}`;
                        return (
                          <QuestionRow key={question.id} question={question}>
                            <Link
                              className={buttonVariants({ variant: 'outline' })}
                              href={adminJlptQuestionUrl({ examId: exam.id, ...questionTarget })}
                              aria-disabled={questionNavigationDisabled}
                              tabIndex={questionNavigationDisabled ? -1 : undefined}
                              onClick={(event) => {
                                if (questionNavigationDisabled) event.preventDefault();
                              }}
                            >
                              <Pencil />
                              {disabled ? 'Xem câu hỏi' : 'Sửa câu hỏi'}
                            </Link>
                            <OrderControls
                              label={questionLabel}
                              index={index}
                              count={part.questions.length}
                              disabled={disabled}
                              onMove={(direction) => onMove(questionTarget, direction)}
                            />
                            {actions(questionTarget, questionLabel)}
                          </QuestionRow>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function QuestionRow({
  question,
  children,
}: {
  question: AdminJlptQuestion;
  children: React.ReactNode;
}) {
  const correct = question.answers.filter((a) => a.isCorrect);
  return (
    <div
      data-question-id={question.id}
      className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:flex-row lg:items-start"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs font-semibold text-slate-600">
          Câu {question.sortOrder + 1} · #{question.id} · {question.answers.length} đáp án ·{' '}
          {question.points} điểm{question.image ? ' · Có ảnh' : ''}
        </p>
        <AdminJlptSafeText
          text={question.questionText}
          className="line-clamp-3 text-sm font-medium text-slate-900"
        />
        {correct.length > 0 ? (
          correct.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs text-emerald-800"
            >
              <span className="font-semibold">Đáp án đúng: </span>
              <AdminJlptSafeText text={a.answerText} className="line-clamp-2" />
            </div>
          ))
        ) : (
          <p className="text-xs text-amber-800">Chưa có đáp án đúng.</p>
        )}
      </div>
      <div className="flex shrink-0 justify-end gap-2">{children}</div>
    </div>
  );
}
