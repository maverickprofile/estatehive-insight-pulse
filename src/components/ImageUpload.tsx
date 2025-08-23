import { useState, useRef } from 'react';
import { StorageService, storageUtils } from '@/services/storage.service';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  entityType: 'property' | 'agent' | 'profile';
  entityId?: string | number;
  multiple?: boolean;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizeMB = 5,
  entityType,
  entityId,
  multiple = true
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check max images limit
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!StorageService.validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported image format`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size
        if (!StorageService.validateFileSize(file, maxSizeMB)) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds ${maxSizeMB}MB limit`,
            variant: "destructive",
          });
          continue;
        }

        // Set progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Compress image
        const compressedFile = await storageUtils.compressImage(file, 1920, 0.85);

        // Upload based on entity type
        let uploadedUrl: string;
        if (entityType === 'property') {
          uploadedUrl = await StorageService.uploadPropertyImage(
            compressedFile,
            entityId as number
          );
        } else if (entityType === 'agent') {
          uploadedUrl = await StorageService.uploadAgentAvatar(
            compressedFile,
            entityId as string
          );
        } else {
          uploadedUrl = await StorageService.uploadProfileAvatar(
            compressedFile,
            entityId as string
          );
        }

        uploadedUrls.push(uploadedUrl);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      });
    }

    setUploading(false);
    setUploadProgress({});
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    try {
      // Delete from storage
      if (entityType === 'property') {
        await StorageService.deletePropertyImage(imageUrl);
      }
      
      // Remove from state
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      
      toast({
        title: "Image removed",
        description: "Image has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Images
            </>
          )}
        </Button>
        
        <span className="text-sm text-muted-foreground">
          {images.length} / {maxImages} images uploaded
        </span>
      </div>

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([filename, progress]) => (
        <div key={filename} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{filename}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ))}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                {image ? (
                  <img
                    src={image}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Main Image
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p>• Supported formats: JPEG, PNG, WebP</p>
        <p>• Maximum file size: {maxSizeMB}MB per image</p>
        <p>• Images will be automatically compressed for optimal performance</p>
        {entityType === 'property' && (
          <p>• First image will be used as the main property image</p>
        )}
      </div>
    </div>
  );
}