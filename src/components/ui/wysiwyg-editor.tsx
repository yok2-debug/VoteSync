'use client';
import 'quill/dist/quill.snow.css';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function WysiwygEditor({ value, onChange, placeholder, className }: WysiwygEditorProps) {

  // Dynamically import ReactQuill to ensure it only runs on the client-side.
  const ReactQuill = useMemo(() => dynamic(() => import('react-quilljs'), { ssr: false }), []);
  
  const modules = {
    toolbar: [
      ['bold', 'italic'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['clean']
    ],
  };

  return (
    <div className={className}>
        <style>
        {`
            .ql-toolbar.ql-snow {
                border-radius: 0.375rem 0.375rem 0 0;
                border-color: hsl(var(--border));
            }
            .ql-container.ql-snow {
                border-radius: 0 0 0.375rem 0.375rem;
                border-color: hsl(var(--border));
                min-height: 120px;
            }
            .ql-editor {
                font-family: inherit;
                color: hsl(var(--foreground));
            }
            .ql-editor.ql-blank::before {
                color: hsl(var(--muted-foreground));
                font-style: normal;
            }
        `}
        </style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
