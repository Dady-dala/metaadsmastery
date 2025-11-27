import React, { useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';

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
  const quillRef = useRef<ReactQuill>(null);
  const [customColor, setCustomColor] = useState('#000000');
  const [customBgColor, setCustomBgColor] = useState('#FFFFFF');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [bgColorPickerOpen, setBgColorPickerOpen] = useState(false);
  const applyTextColor = (color: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      quill.format('color', color);
    }
    setColorPickerOpen(false);
  };

  const applyBgColor = (color: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      quill.format('background', color);
    }
    setBgColorPickerOpen(false);
  };

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
    <div className={cn("rich-text-editor space-y-2", className)}>
      <div className="flex gap-2 items-center">
        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Palette className="w-4 h-4" />
              Couleur Texte
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pipette de couleur</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Button 
                    onClick={() => applyTextColor(customColor)}
                    className="flex-1"
                  >
                    Appliquer
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code couleur (hex)</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => applyTextColor(customColor)}
                  >
                    Appliquer
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={bgColorPickerOpen} onOpenChange={setBgColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Palette className="w-4 h-4" />
              Couleur Fond
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pipette de couleur</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Button 
                    onClick={() => applyBgColor(customBgColor)}
                    className="flex-1"
                  >
                    Appliquer
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code couleur (hex)</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => applyBgColor(customBgColor)}
                  >
                    Appliquer
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <ReactQuill
        ref={quillRef}
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
