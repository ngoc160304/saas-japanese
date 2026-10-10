import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExamConfirmDialogProps {
  kind: 'exit' | 'submit' | null;
  answeredCount: number;
  totalCount: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ExamConfirmDialog({ kind, answeredCount, totalCount, onOpenChange, onConfirm }: ExamConfirmDialogProps) {
  return (
    <AlertDialog open={kind !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-bold text-slate-900">{kind === 'exit' ? 'Exit exam?' : 'Submit this section?'}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-slate-600">
            {kind === 'exit'
              ? 'Your local answers and flags will be lost when you leave this exam.'
              : `${answeredCount} answered and ${totalCount - answeredCount} unanswered out of ${totalCount} questions. This only submits the local practice section.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 border-0 bg-transparent p-0">
          <AlertDialogCancel>Keep practicing</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={onConfirm} className="bg-sky-600 text-white hover:bg-sky-500">
            {kind === 'exit' ? 'Exit exam' : 'Submit section'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
