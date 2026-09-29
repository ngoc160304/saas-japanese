'use client';

import { Editor } from '@tinymce/tinymce-react';

interface GrammarRichTextEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function GrammarRichTextEditor({ id, value, onChange }: GrammarRichTextEditorProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 [&_.tox-tinymce]:border-0">
      <Editor
        id={id}
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        value={value}
        onEditorChange={onChange}
        init={{
          base_url: '/tinymce',
          suffix: '.min',
          height: 280,
          menubar: false,
          plugins: ['lists', 'wordcount'],
          toolbar:
            'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | removeformat',
          toolbar_mode: 'sliding',
          branding: false,
          promotion: false,
          resize: false,
          content_style:
            "body { font-family: 'Plus Jakarta Sans', Inter, sans-serif; font-size: 13px; line-height: 1.65; color: #334155; padding: 8px 12px; } h2, h3 { color: #0f172a; }",
        }}
      />
    </div>
  );
}
