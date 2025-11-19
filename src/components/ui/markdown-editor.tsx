'use client';
import 'easymde/dist/easymde.min.css';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const SimpleMdeReact = useMemo(
    () => dynamic(() => import('react-simplemde-editor'), { ssr: false }),
    []
  );

  const options = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      toolbar: ['bold', 'italic', '|', 'ordered-list', 'unordered-list'],
      status: false,
      minHeight: '150px',
    };
  }, []);

  return <SimpleMdeReact options={options} value={value} onChange={onChange} />;
}
