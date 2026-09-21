import { Badge } from '@/components/ui/badge';

export function CourseStatusBadge({ published }: { published: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        published
          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
          : 'border-amber-100 bg-amber-50 text-amber-700'
      }
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {published ? 'Published' : 'Draft'}
    </Badge>
  );
}
