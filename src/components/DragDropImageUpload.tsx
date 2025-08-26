import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { StorageService, storageUtils } from '@/services/storage.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Link2, 
  Move,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragDropImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  entityType: 'property' | 'agent' | 'profile';
  entityId?: string | number;
  multiple?: boolean;
}

export default function DragDropImageUpload({
  images,
  onImagesChange,
  maxImages = 20,
  maxSizeMB = 10,
  entityType,
  entityId,
  multiple = true
}: DragDropImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleImageReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onImagesChange(newImages);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check max images limit
    if (images.length + acceptedFiles.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of acceptedFiles) {
      try {
        // Validate file type
        if (!storageUtils.isValidImageType(file)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported image format`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size
        if (!storageUtils.isValidFileSize(file, maxSizeMB)) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds ${maxSizeMB}MB limit`,
            variant: "destructive",
          });
          continue;
        }

        // Upload the file
        const url = await StorageService.uploadImage(file, entityType, entityId);
        uploadedUrls.push(url);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
      toast({
        title: "Upload successful",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      });
    }

    setUploading(false);
  }, [images, maxImages, maxSizeMB, entityType, entityId, onImagesChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg']
    },
    multiple,
    disabled: uploading || images.length >= maxImages
  });

  const handleAddImageUrl = () => {
    if (!urlInput.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
      return;
    }

    if (images.length >= maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
      onImagesChange([...images, urlInput]);
      setUrlInput('');
      setShowUrlInput(false);
      toast({
        title: "Image added",
        description: "Image URL added successfully",
      });
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          (uploading || images.length >= maxImages) && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p>Uploading images...</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-primary mb-3" />
            <p>Drop the images here...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ImageIcon className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-lg font-medium mb-1">
              Drag & drop images here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Supports: JPG, PNG, GIF, WebP (max {maxSizeMB}MB each)
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {images.length} / {maxImages} images uploaded
            </p>
          </div>
        )}
      </div>

      {/* Add Image URL Option */}
      <div className="flex items-center gap-2">
        {!showUrlInput ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUrlInput(true)}
            disabled={images.length >= maxImages}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Add Image URL
          </Button>
        ) : (
          <>
            <Input
              type="url"
              placeholder="Enter image URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddImageUrl()}
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddImageUrl}
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Image Preview with Drag Reordering */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Images (drag to reorder):</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setHoveredIndex(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndex !== null && draggedIndex !== index) {
                    handleImageReorder(draggedIndex, index);
                  }
                  setDraggedIndex(null);
                  setHoveredIndex(null);
                }}
                className={cn(
                  "relative group aspect-square rounded-lg overflow-hidden border-2 cursor-move transition-all",
                  draggedIndex === index && "opacity-50",
                  hoveredIndex === index && draggedIndex !== null && "border-primary scale-105"
                )}
              >
                <img
                  src={image}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay with controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="text-white text-xs bg-black/75 px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Drag handle indicator */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Move className="h-4 w-4 text-white drop-shadow" />
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Tip: Drag and drop images to reorder them. The first image will be the main property image.
          </p>
        </div>
      )}
    </div>
  );
}