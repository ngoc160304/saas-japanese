import { Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VocabularyItem } from '@/apis/lessons/lesson-content.api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function VocabularyTable({
  items,
  emptyMessage,
}: {
  items: readonly VocabularyItem[];
  emptyMessage: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <Table className="min-w-4xl text-left text-xs">
        <TableHeader className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-auto w-12 px-4 py-3 text-[11px] font-bold text-slate-500">
              #
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-[11px] font-bold text-slate-500">
              Word (Kanji)
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-[11px] font-bold text-slate-500">
              Reading (Kana)
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-[11px] font-bold text-slate-500">
              Vietnamese Meaning
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-[11px] font-bold text-slate-500">
              Example Sentence
            </TableHead>
            <TableHead className="h-auto w-24 px-4 py-3 text-right text-[11px] font-bold text-slate-500">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/60">
                <TableCell className="px-4 py-3 font-bold text-slate-400">{index + 1}</TableCell>
                <TableCell className="px-4 py-3 text-sm font-bold text-slate-900">
                  {item.word}
                </TableCell>
                <TableCell className="px-4 py-3 font-medium text-sky-700">{item.reading}</TableCell>
                <TableCell className="px-4 py-3 font-semibold text-slate-700">
                  <p>{item.meaningVi}</p>
                  {item.partOfSpeech && (
                    <span
                      aria-label={`Part of speech: ${item.partOfSpeech}`}
                      className="mt-1 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700"
                    >
                      {item.partOfSpeech}
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs px-4 py-3 text-[11px] text-slate-500">
                  {item.exampleSentenceJp && <p>{item.exampleSentenceJp}</p>}
                  {item.exampleSentenceVi && <p>{item.exampleSentenceVi}</p>}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${item.word}`}
                      title={`Edit ${item.word}`}
                      className="rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${item.word}`}
                      title={`Delete ${item.word}`}
                      className="rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="px-4 py-10 text-center text-xs text-slate-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
