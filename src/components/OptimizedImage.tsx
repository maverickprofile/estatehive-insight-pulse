import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  loadingClassName?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: string;
}

const OptimizedImage = React.memo(({
  src,
  alt,
  fallbackSrc = `https://via.placeholder.com/400x300?text=${encodeURIComponent(alt || 'Image')}`,
  className,
  containerClassName,
  loadingClassName,
  priority = false,
  onLoad,
  onError,
  aspectRatio,
  ...props
}: OptimizedImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.01
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  // Preload priority images
  useEffect(() => {
    if (priority && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setLoading(false);
      img.onerror = () => setError(true);
    }
  }, [priority, src]);

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-gray-100 dark:bg-gray-800",
        containerClassName,
        aspectRatio && `aspect-[${aspectRatio}]`
      )}
    >
      {/* Loading skeleton */}
      {loading && (
        <div 
          className={cn(
            "absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600",
            loadingClassName
          )}
        />
      )}

      {/* Error fallback */}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <ImageOff className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Failed to load image</p>
          </div>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={isInView ? (error ? fallbackSrc : src) : undefined}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loading ? "opacity-0" : "opacity-100",
            className
          )}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;

// Hook for preloading multiple images
export const useImagePreloader = (imageUrls: string[]) => {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!imageUrls.length) {
      setLoaded(true);
      return;
    }

    let loadedCount = 0;
    const totalImages = imageUrls.length;
    const images: HTMLImageElement[] = [];

    const updateProgress = () => {
      loadedCount++;
      setProgress(Math.round((loadedCount / totalImages) * 100));
      if (loadedCount === totalImages) {
        setLoaded(true);
      }
    };

    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = updateProgress;
      img.onerror = updateProgress; // Count errors as "loaded" to prevent hanging
      images.push(img);
    });

    return () => {
      // Clean up if component unmounts
      images.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [imageUrls]);

  return { loaded, progress };
};