import { LoaderCircle } from 'lucide-react';
interface IsLoadingProps {
  className?: string;
  size?: number;
}
export function IsLoading({ className = '', size = 20 }: IsLoadingProps) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      {' '}
      <LoaderCircle size={size} className="animate-spin text-slate-900" />{' '}
    </div>
  );
}
