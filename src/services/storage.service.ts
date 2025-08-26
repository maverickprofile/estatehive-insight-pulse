import { supabase } from '@/lib/supabaseClient';

/**
 * Storage utility functions
 */
export const storageUtils = {
  /**
   * Check if file type is a valid image format
   */
  isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return validTypes.includes(file.type);
  },

  /**
   * Check if file size is within limit
   */
  isValidFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  /**
   * Generate unique filename
   */
  generateUniqueFileName(originalName: string, prefix?: string): string {
    const fileExt = originalName.split('.').pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix || 'file'}-${timestamp}-${randomStr}.${fileExt}`;
  },

  /**
   * Convert File to base64
   */
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  /**
   * Compress image before upload
   */
  compressImage: async (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * Get file extension
   */
  getFileExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  }
};

/**
 * Storage Service for handling file uploads to Supabase Storage
 */
export class StorageService {
  /**
   * Generic upload image method for different entity types
   */
  static async uploadImage(
    file: File, 
    entityType: 'property' | 'agent' | 'profile', 
    entityId?: string | number
  ): Promise<string> {
    switch (entityType) {
      case 'property':
        return this.uploadPropertyImage(file, entityId as number);
      case 'agent':
        return this.uploadAgentAvatar(file, entityId as string);
      case 'profile':
        return this.uploadProfileAvatar(file, entityId as string);
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Upload property images
   */
  static async uploadPropertyImage(file: File, propertyId?: number): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId || 'temp'}-${Date.now()}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading property image:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  }

  /**
   * Upload multiple property images
   */
  static async uploadPropertyImages(files: File[], propertyId?: number): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadPropertyImage(file, propertyId)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error: any) {
      console.error('Error uploading property images:', error);
      throw new Error(error.message || 'Failed to upload images');
    }
  }

  /**
   * Upload agent avatar
   */
  static async uploadAgentAvatar(file: File, agentId?: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${agentId || 'temp'}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Delete old avatar if exists
      if (agentId) {
        await this.deleteAgentAvatar(agentId);
      }

      const { data, error } = await supabase.storage
        .from('agent-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('agent-avatars')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading agent avatar:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  }

  /**
   * Upload profile avatar
   */
  static async uploadProfileAvatar(file: File, userId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { data, error } = await supabase.storage
        .from('agent-avatars') // Using agent-avatars bucket for all avatars
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('agent-avatars')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading profile avatar:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  }

  /**
   * Upload property documents (PDF, DOC)
   */
  static async uploadPropertyDocument(file: File, propertyId: number, docType: 'floor_plan' | 'brochure' | 'other' = 'other'): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}-${docType}-${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { data, error } = await supabase.storage
        .from('property-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get signed URL (documents are private)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('property-documents')
        .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days expiry

      if (urlError) throw urlError;

      return signedUrlData.signedUrl;
    } catch (error: any) {
      console.error('Error uploading property document:', error);
      throw new Error(error.message || 'Failed to upload document');
    }
  }

  /**
   * Delete property image
   */
  static async deletePropertyImage(imageUrl: string): Promise<void> {
    try {
      const path = this.extractPathFromUrl(imageUrl, 'property-images');
      if (!path) return;

      const { error } = await supabase.storage
        .from('property-images')
        .remove([path]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting property image:', error);
      throw new Error(error.message || 'Failed to delete image');
    }
  }

  /**
   * Delete agent avatar
   */
  static async deleteAgentAvatar(agentId: string): Promise<void> {
    try {
      // List all files in avatars folder for this agent
      const { data: files, error: listError } = await supabase.storage
        .from('agent-avatars')
        .list('avatars', {
          search: agentId
        });

      if (listError) throw listError;

      if (files && files.length > 0) {
        const filePaths = files.map(file => `avatars/${file.name}`);
        
        const { error } = await supabase.storage
          .from('agent-avatars')
          .remove(filePaths);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error deleting agent avatar:', error);
      // Don't throw error for deletion failures
    }
  }

  /**
   * Upload client document
   */
  static async uploadClientDocument(file: File, clientId: number): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}-${Date.now()}.${fileExt}`;
      const filePath = `clients/${fileName}`;

      const { data, error } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get signed URL (client documents are private)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(data.path, 60 * 60 * 24 * 30); // 30 days expiry

      if (urlError) throw urlError;

      return signedUrlData.signedUrl;
    } catch (error: any) {
      console.error('Error uploading client document:', error);
      throw new Error(error.message || 'Failed to upload document');
    }
  }

  /**
   * Get file size validation
   */
  static validateFileSize(file: File, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Validate file type
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => file.type.includes(type));
  }

  /**
   * Extract path from Supabase storage URL
   */
  private static extractPathFromUrl(url: string, bucket: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(new RegExp(`storage/v1/object/public/${bucket}/(.+)`));
      return pathMatch ? pathMatch[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Get image thumbnail URL
   */
  static getImageThumbnail(imageUrl: string, width: number = 200, height: number = 200): string {
    // Supabase doesn't support automatic thumbnails, so we return the original
    // In production, you might want to use a CDN or image processing service
    return imageUrl;
  }

  /**
   * Batch upload with progress callback
   */
  static async uploadWithProgress(
    file: File,
    bucket: string,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Note: Supabase doesn't support progress tracking natively
      // This is a simplified version
      if (onProgress) onProgress(0);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      if (onProgress) onProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      throw new Error(error.message || 'Failed to upload file');
    }
  }
}
