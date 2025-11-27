import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Crop, RotateCw, Sun, Contrast, Droplets, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
}

export const ImageEditor = ({ imageFile, onSave, onCancel }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [originalImage, setOriginalImage] = useState<fabric.FabricImage | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<fabric.Rect | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f0f0f0',
    });

    setFabricCanvas(canvas);

    // Load image
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      fabric.FabricImage.fromURL(imgUrl).then((img) => {
        // Scale image to fit canvas
        const scale = Math.min(
          canvas.width! / (img.width || 1),
          canvas.height! / (img.height || 1)
        ) * 0.9;
        
        img.scale(scale);
        img.set({
          left: (canvas.width! - (img.width || 0) * scale) / 2,
          top: (canvas.height! - (img.height || 0) * scale) / 2,
          selectable: false,
        });
        
        canvas.add(img);
        canvas.renderAll();
        setOriginalImage(img);
      });
    };
    reader.readAsDataURL(imageFile);

    return () => {
      canvas.dispose();
    };
  }, [imageFile]);

  const applyFilters = () => {
    if (!originalImage || !fabricCanvas) return;

    // Clear existing filters
    originalImage.filters = [];

    // Apply brightness
    if (brightness !== 0) {
      originalImage.filters.push(new fabric.filters.Brightness({
        brightness: brightness / 100,
      }));
    }

    // Apply contrast
    if (contrast !== 0) {
      originalImage.filters.push(new fabric.filters.Contrast({
        contrast: contrast / 100,
      }));
    }

    // Apply saturation
    if (saturation !== 0) {
      originalImage.filters.push(new fabric.filters.Saturation({
        saturation: saturation / 100,
      }));
    }

    originalImage.applyFilters();
    fabricCanvas.renderAll();
  };

  useEffect(() => {
    applyFilters();
  }, [brightness, contrast, saturation]);

  const handleRotate = () => {
    if (!originalImage || !fabricCanvas) return;
    const currentAngle = originalImage.angle || 0;
    originalImage.rotate(currentAngle + 90);
    fabricCanvas.renderAll();
  };

  const handleCrop = () => {
    if (!fabricCanvas || !originalImage) return;

    if (!isCropMode) {
      // Enter crop mode
      setIsCropMode(true);
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 300,
        height: 300,
        fill: 'transparent',
        stroke: 'blue',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      setCropRect(rect);
      fabricCanvas.renderAll();
    } else {
      // Apply crop
      if (cropRect) {
        const left = cropRect.left || 0;
        const top = cropRect.top || 0;
        const width = (cropRect.width || 0) * (cropRect.scaleX || 1);
        const height = (cropRect.height || 0) * (cropRect.scaleY || 1);

        originalImage.clipPath = new fabric.Rect({
          left: left - (originalImage.left || 0),
          top: top - (originalImage.top || 0),
          width: width,
          height: height,
          absolutePositioned: true,
        });

        fabricCanvas.remove(cropRect);
        setCropRect(null);
        setIsCropMode(false);
        fabricCanvas.renderAll();
      }
    }
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;

    try {
      // Export canvas to blob
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });

      const response = await fetch(dataURL);
      const blob = await response.blob();

      onSave(blob);
      toast.success('Image éditée avec succès');
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Éditeur d'Image</Label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="gap-2">
              <X className="w-4 h-4" />
              Annuler
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Check className="w-4 h-4" />
              Enregistrer
            </Button>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden bg-muted/50">
          <canvas ref={canvasRef} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={handleCrop}
            className={isCropMode ? 'bg-primary text-primary-foreground' : ''}
          >
            <Crop className="w-4 h-4 mr-2" />
            {isCropMode ? 'Appliquer Recadrage' : 'Recadrer'}
          </Button>
          <Button variant="outline" onClick={handleRotate}>
            <RotateCw className="w-4 h-4 mr-2" />
            Rotation 90°
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <Label>Luminosité: {brightness}</Label>
            </div>
            <Slider
              value={[brightness]}
              onValueChange={(values) => setBrightness(values[0])}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Contrast className="w-4 h-4" />
              <Label>Contraste: {contrast}</Label>
            </div>
            <Slider
              value={[contrast]}
              onValueChange={(values) => setContrast(values[0])}
              min={-100}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              <Label>Saturation: {saturation}</Label>
            </div>
            <Slider
              value={[saturation]}
              onValueChange={(values) => setSaturation(values[0])}
              min={-100}
              max={100}
              step={1}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
