import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className
}) => {
  const customColors = [
    '#FFFFFF', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#111827', '#000000',
    '#22C55E', '#16A34A', '#15803D', '#166534', '#14532D',
    '#FEF08A', '#FDE047', '#FACC15', '#EAB308', '#CA8A04', '#A16207',
    '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
    '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
    '#C084FC', '#A855F7', '#9333EA', '#7C3AED', '#6D28D9',
    '#FB923C', '#F97316', '#EA580C', '#C2410C', '#9A3412'
  ];

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': customColors }, { 'background': customColors }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link'
  ];

  return (
    <div className={cn("rich-text-editor", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background text-foreground [&_.ql-toolbar]:bg-muted [&_.ql-toolbar]:border-border [&_.ql-container]:border-border [&_.ql-editor]:min-h-[150px]"
      />
    </div>
  );
};

export default RichTextEditor;
