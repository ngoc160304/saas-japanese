'use client';
import { useRef, useState, type ReactElement } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Props {
  trigger: ReactElement;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  errorMessage: (error: unknown) => string;
}
export function DeleteConfirmPopover({
  trigger,
  title,
  description,
  onConfirm,
  errorMessage,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const confirm = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        if (submitting.current) return;
        setError(null);
        setOpen(value);
      }}
    >
      <PopoverTrigger render={trigger} disabled={pending} />
      <PopoverContent className="w-64 p-3">
        <PopoverTitle className="text-sm font-semibold">{title}</PopoverTitle>
        <PopoverDescription className="mt-1.5 break-words text-xs text-slate-500">
          {description}
        </PopoverDescription>
        {error && (
          <p role="alert" className="mt-1.5 text-xs text-rose-600">
            {error}
          </p>
        )}
        <div className="mt-3 flex justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:text-slate-900"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Hủy
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            disabled={pending}
            onClick={confirm}
          >
            {pending && <LoaderCircle className="animate-spin" />}
            {pending ? 'Đang xóa…' : 'Xóa'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
