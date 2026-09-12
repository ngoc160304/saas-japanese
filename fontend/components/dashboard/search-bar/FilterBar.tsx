import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, Search } from 'lucide-react';
interface CourseFiltersProps {
  search?: string;
  status?: string;
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string | null) => void;
  onReset?: () => void;
}
const FilterBar = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
}: CourseFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <Input
          value={search}
          // onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search courses by title or overview..."
          className="h-10 rounded-2xl border-slate-100 bg-slate-50 pl-10 text-xs md:text-sm"
        />
      </div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10 w-[150px] rounded-2xl">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-10 rounded-2xl px-3 text-xs font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
