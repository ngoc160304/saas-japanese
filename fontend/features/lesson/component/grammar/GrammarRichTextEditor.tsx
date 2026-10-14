'use client';

import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';

interface GrammarRichTextEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onReady?: (editor: TinyMCEEditor) => void;
}

export function GrammarRichTextEditor({ id, value, onChange, onReady }: GrammarRichTextEditorProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 [&_.tox-tinymce]:max-w-full [&_.tox-tinymce]:rounded-2xl [&_.tox-tinymce]:border-0">
      <Editor
        id={id}
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        value={value}
        onEditorChange={onChange}
        onInit={(_, editor) => onReady?.(editor)}
        init={{
          base_url: '/tinymce',
          suffix: '.min',
          height: 280,
          min_height: 220,
          menubar: false,
          plugins: ['lists', 'link', 'wordcount'],
          toolbar:
            'undo redo | blocks | bold italic underline | bullist numlist | link unlink | removeformat',
          toolbar_mode: 'sliding',
          branding: false,
          promotion: false,
          statusbar: true,
          resize: true,
          content_style:
            "body { font-family: 'Plus Jakarta Sans', Inter, sans-serif; font-size: 13px; line-height: 1.65; color: #334155; padding: 8px 12px; } h2, h3 { color: #0f172a; }",
        }}
      />
    </div>
  );
}
