import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AuthFormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-2xl border border-rose-100 bg-rose-50 p-3.5 text-xs font-medium text-rose-700"
    >
      {message}
    </p>
  );
}

export function AuthSubmit({
  pending,
  disabled,
  children,
}: {
  pending: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="mt-2 h-11 w-full gap-2 rounded-2xl bg-slate-900 px-4 font-bold text-white shadow-md hover:bg-sky-600 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
      {!pending && <ArrowRight className="size-4" aria-hidden="true" />}
    </Button>
  );
}
