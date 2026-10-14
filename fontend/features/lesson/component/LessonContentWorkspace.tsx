'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Course } from '@/apis/courses/courses.type';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLessonWorkspaceActions } from '../hooks/useLessonWorkspaceActions';
import { useLessonVideo } from '../hooks/useLessonVideo';
import { LessonContentTabs, type LessonContentTab } from './LessonContentTabs';
import { LessonCurriculumSidebar } from './LessonCurriculumSidebar';
import { LessonHeaderCard } from './LessonHeaderCard';
import { LessonWorkspaceHeader } from './LessonWorkspaceHeader';
import { LessonPreviewDialog } from './LessonPreviewDialog';

export function LessonContentWorkspace({
  courseId,
  lessonId,
  course,
  lesson,
}: {
  courseId: number;
  lessonId: number;
  course: Course;
  lesson: Lesson;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: LessonContentTab =
    tabParam === 'vocabulary' || tabParam === 'kanji' || tabParam === 'quiz' ? tabParam : 'grammar';
  const curriculumQuery = useQuery({
    queryKey: ['lessons', 'curriculum', courseId],
    queryFn: ({ signal }) => lessonAPI.getCourseCurriculum(courseId, signal),
    retry: false,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);
  const [publicationOpen, setPublicationOpen] = useState(false);
  const [showPublicationError, setShowPublicationError] = useState(false);
  const [quizBusy, setQuizBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewGuard, setPreviewGuard] = useState(false);
  const actions = useLessonWorkspaceActions(lesson);
  const video = useLessonVideo(lesson);

  useEffect(() => {
    if (!actions.dirty && !video.hasPendingWork) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [actions.dirty, video.hasPendingWork]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setDrawerOpen(false);
    }
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  function selectTab(tab: LessonContentTab) {
    setDrawerOpen(false);
    if (tab === activeTab && tabParam === tab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function guardNavigation(href: string, event: { preventDefault(): void }) {
    setDrawerOpen(false);
    const current = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ''}`;
    if (href === current) return;
    if (actions.dirty || actions.isSaving || video.hasPendingWork) {
      event.preventDefault();
      setPendingDestination(href);
    }
  }

  function discardAndLeave() {
    if (!pendingDestination || video.isBusy) return;
    const destination = pendingDestination;
    actions.discardDraft();
    video.discardPrepared();
    setPendingDestination(null);
    router.push(destination, { scroll: false });
  }

  async function confirmPublication() {
    setShowPublicationError(false);
    if (await actions.changePublication(!lesson.isPublished)) setPublicationOpen(false);
    else setShowPublicationError(true);
  }

  const sidebarProps = {
    courseId,
    lessonId,
    lessons:
      curriculumQuery.data?.filter((item) => item.courseId === courseId && !item.isDeleted) ?? [],
    curriculumLoading: curriculumQuery.isPending,
    curriculumError: curriculumQuery.isError ? getApiErrorMessage(curriculumQuery.error) : null,
    onRetryCurriculum: () => void curriculumQuery.refetch(),
    activeTab,
    search,
    expanded,
    onSelectTab: selectTab,
    onNavigate: guardNavigation,
    searchParams: searchParams.toString(),
    onSearchChange: setSearch,
    onToggleExpanded: () => setExpanded((value) => !value),
  };

  return (
    <>
      <div className="fixed inset-0 flex min-h-0 flex-col overflow-hidden bg-[#f3f6fa] text-slate-800 antialiased">
        <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
          <LessonWorkspaceHeader
            courseId={courseId}
            courseTitle={course.title}
            lessonTitle={lesson.title}
            onNavigate={guardNavigation}
            onPreview={() => { if (actions.dirty || video.hasPendingWork) setPreviewGuard(true); else setPreviewOpen(true); }}
            previewDisabled={quizBusy || actions.isSaving || actions.isChangingPublication || video.isBusy}
          />
          <DialogContent
            showCloseButton={false}
            className="top-0 left-0 flex h-dvh w-80 max-w-[calc(100%-1rem)] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 text-slate-800 sm:max-w-80"
          >
            <DialogTitle className="sr-only">Lesson curriculum</DialogTitle>
            <LessonCurriculumSidebar {...sidebarProps} mobile />
          </DialogContent>
        </Dialog>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            aria-label="Lesson curriculum"
            className="hidden w-80 shrink-0 border-r border-slate-200 lg:block"
          >
            <LessonCurriculumSidebar {...sidebarProps} />
          </aside>
          <main
            aria-label="Lesson content workspace"
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 lg:p-7"
          >
            <div className="space-y-5">
              <LessonHeaderCard
                courseId={courseId}
                lessonId={lessonId}
                lesson={lesson}
                showGrammarSave={activeTab === 'grammar'}
                grammarDirty={actions.dirty}
                isSaving={actions.isSaving}
                isChangingPublication={actions.isChangingPublication}
                isVideoBusy={video.isBusy}
                saveError={actions.saveError ? getApiErrorMessage(actions.saveError) : null}
                onSave={() => void actions.saveGrammar()}
                onPublicationClick={() => { setShowPublicationError(false); setPublicationOpen(true); }}
                onNavigate={guardNavigation}
              />
              <LessonContentTabs
                activeTab={activeTab}
                onTabChange={selectTab}
                lesson={lesson}
                lessonId={lessonId}
                grammarDraft={actions.draft}
                onGrammarChange={actions.setDraft}
                onGrammarSave={() => void actions.saveGrammar()}
                onGrammarCancel={actions.discardDraft}
                grammarDirty={actions.dirty}
                grammarSaving={actions.isSaving}
                grammarSaveError={actions.saveError ? getApiErrorMessage(actions.saveError) : null}
                video={video}
                videoDisabled={actions.isSaving || actions.isChangingPublication || video.isBusy}
                onReloadVideo={() => void queryClient.invalidateQueries({ queryKey: ['lessons', 'detail', lesson.id] })}
                onQuizBusyChange={setQuizBusy}
              />
            </div>
          </main>
        </div>
      </div>
      <AlertDialog open={pendingDestination !== null} onOpenChange={(open) => { if (!open) setPendingDestination(null); }}>
        <AlertDialogContent className="max-w-md rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{actions.dirty || video.hasPendingWork ? 'Có thay đổi chưa hoàn tất' : 'Đã lưu ngữ pháp'}</AlertDialogTitle>
            <AlertDialogDescription>
              {video.isBusy
                ? 'Đang xử lý video. Hãy chờ thao tác hoàn tất trước khi rời bài học.'
                : actions.isSaving
                ? 'Đang lưu ngữ pháp. Hãy chờ thao tác hoàn tất trước khi rời bài học.'
                : actions.dirty || video.hasPendingWork
                  ? 'Bản nháp ngữ pháp hoặc video đã chọn/chưa gắn sẽ bị bỏ lại nếu bạn rời bài học này.'
                  : 'Thay đổi ngữ pháp đã được lưu. Bạn có thể rời bài học.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row flex-wrap justify-end">
            <AlertDialogCancel>Ở lại</AlertDialogCancel>
            <AlertDialogAction disabled={actions.isSaving || video.isBusy} onClick={discardAndLeave} className="bg-rose-700 text-white hover:bg-rose-800">
              {actions.dirty || video.hasPendingWork ? 'Bỏ thay đổi và rời đi' : 'Rời đi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={publicationOpen} onOpenChange={setPublicationOpen}>
        <AlertDialogContent className="max-w-md rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{lesson.isPublished ? 'Ẩn bài học?' : actions.dirty ? 'Lưu ngữ pháp trước khi xuất bản' : 'Xuất bản bài học?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {lesson.isPublished
                ? 'Bài học sẽ chuyển về bản nháp. Nội dung ngữ pháp chưa lưu sẽ được giữ nguyên trong trình soạn thảo.'
                : actions.dirty
                  ? 'Xuất bản chỉ dùng nội dung đã lưu. Hãy lưu hoặc bỏ bản nháp, sau đó chọn Xuất bản lại.'
                  : 'Bài học sẽ được đánh dấu đã xuất bản với nội dung đang lưu trên máy chủ.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {showPublicationError && actions.publicationError && <p role="alert" className="text-sm text-rose-700">{getApiErrorMessage(actions.publicationError)}</p>}
          {!lesson.isPublished && actions.dirty && actions.saveError && <p role="alert" className="text-sm text-rose-700">{getApiErrorMessage(actions.saveError)}</p>}
          <AlertDialogFooter className="flex-row flex-wrap justify-end">
            <AlertDialogCancel disabled={actions.isSaving || actions.isChangingPublication}>Ở lại</AlertDialogCancel>
            {!lesson.isPublished && actions.dirty ? (
              <>
                <Button type="button" disabled={actions.isSaving} onClick={() => { actions.discardDraft(); setPublicationOpen(false); }} className="bg-slate-600 text-white hover:bg-slate-700">Bỏ bản nháp</Button>
                <Button type="button" disabled={actions.isSaving} onClick={() => { void actions.saveGrammar().then((saved) => { if (saved) setPublicationOpen(false); }); }} className="bg-primary text-white hover:bg-primary/90">{actions.isSaving ? 'Đang lưu…' : 'Lưu ngữ pháp'}</Button>
              </>
            ) : (
              <Button type="button" disabled={actions.isChangingPublication} onClick={() => void confirmPublication()} className="bg-primary text-white hover:bg-primary/90">{actions.isChangingPublication ? 'Đang cập nhật…' : lesson.isPublished ? 'Ẩn bài học' : 'Xuất bản'}</Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={previewGuard} onOpenChange={open => { if (!actions.isSaving) setPreviewGuard(open); }}>
        <AlertDialogContent className="rounded-3xl bg-white text-slate-900">
          <AlertDialogHeader><AlertDialogTitle>Xem trước nội dung đã lưu</AlertDialogTitle>
            <AlertDialogDescription>{video.hasPendingWork ? 'Video đang chọn chưa được lưu. Hãy hoàn tất hoặc hủy thao tác video trước khi xem trước.' : 'Ngữ pháp có thay đổi chưa lưu. Bạn có thể lưu, bỏ thay đổi hoặc xem bản đã lưu và giữ nguyên bản nháp.'}</AlertDialogDescription></AlertDialogHeader>
          {actions.saveError && <p role="alert" className="text-rose-700">{getApiErrorMessage(actions.saveError)}</p>}
          <AlertDialogFooter className="flex-row flex-wrap justify-end">
            <Button variant="outline" disabled={actions.isSaving} onClick={() => setPreviewGuard(false)}>Hủy</Button>
            {!video.hasPendingWork && <>
              <Button variant="outline" disabled={actions.isSaving} onClick={() => { setPreviewGuard(false); setPreviewOpen(true); }}>Xem bản đã lưu</Button>
              <Button variant="outline" disabled={actions.isSaving} onClick={() => { actions.discardDraft(); setPreviewGuard(false); setPreviewOpen(true); }}>Bỏ thay đổi và xem</Button>
              <Button disabled={actions.isSaving} onClick={() => { void actions.saveGrammar().then(saved => { if (saved) { setPreviewGuard(false); setPreviewOpen(true); } }); }} className="bg-primary text-white hover:bg-primary/90">{actions.isSaving ? 'Đang lưu…' : 'Lưu và xem trước'}</Button>
            </>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {previewOpen && <LessonPreviewDialog lessonId={lessonId} courseId={courseId} onClose={() => setPreviewOpen(false)} />}
    </>
  );
}
