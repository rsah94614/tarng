import * as React from "react";
import { cn } from "@/lib/utils";
import { UploadCloud, X } from "lucide-react";

export interface ImageUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  className?: string;
  previewUrl?: string | null;
}

export function ImageUpload({ value, onChange, className, previewUrl }: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(previewUrl || null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let active = true;
    let url: string | null = null;

    if (value) {
      url = URL.createObjectURL(value);
      Promise.resolve().then(() => {
        if (active) setPreview(url);
      });
    } else if (previewUrl) {
      Promise.resolve().then(() => {
        if (active) setPreview(previewUrl);
      });
    } else {
      Promise.resolve().then(() => {
        if (active) setPreview(null);
      });
    }

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [value, previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors hover:bg-muted/50",
        className
      )}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {preview ? (
        <>
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 p-6 text-muted-foreground">
          <UploadCloud className="h-8 w-8" />
          <span className="text-sm font-medium">Click to upload image</span>
        </div>
      )}
    </div>
  );
}
