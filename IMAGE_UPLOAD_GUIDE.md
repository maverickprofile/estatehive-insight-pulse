# Image Upload System - Estate Hive CRM

## Overview
The database migration has created storage buckets and the application now supports full image upload functionality for:
- Property images and documents
- Agent avatars  
- User profile pictures
- Client documents

## Storage Buckets Created

### 1. **property-images** (Public)
- For property photos and galleries
- Max size: 5MB per image
- Formats: JPEG, PNG, WebP
- Public access for property listings

### 2. **property-documents** (Private)
- For floor plans, brochures, PDFs
- Max size: 10MB per document
- Formats: PDF, DOC
- Requires authentication to access

### 3. **agent-avatars** (Public)
- For agent profile pictures
- Max size: 2MB per image
- Formats: JPEG, PNG
- Public access for agent profiles

### 4. **client-documents** (Private)
- For client agreements and documents
- Max size: 10MB per document
- Formats: PDF
- Restricted access

## How to Use Image Upload

### In AddAgent Component
```jsx
import { StorageService } from '@/services/storage.service';

// The handleImageUpload function now:
// 1. Validates file type and size
// 2. Compresses the image
// 3. Uploads to Supabase storage
// 4. Returns the public URL
```

### In AddProperty Component
```jsx
import ImageUpload from '@/components/ImageUpload';

// Use the ImageUpload component:
<ImageUpload
  images={propertyImages}
  onImagesChange={setPropertyImages}
  entityType="property"
  entityId={propertyId}
  maxImages={20}
  maxSizeMB={5}
/>
```

## Features Implemented

### 1. **Automatic Image Compression**
- Images are automatically compressed before upload
- Maintains quality while reducing file size
- Resizes large images to max 1920px width

### 2. **Validation**
- File type validation (only allowed formats)
- File size validation (configurable limits)
- Maximum number of images per entity

### 3. **Progress Tracking**
- Shows upload progress for each file
- Visual feedback during upload

### 4. **Image Management**
- Preview uploaded images
- Remove images with automatic deletion from storage
- Reorder images (first image is main)

### 5. **Error Handling**
- Graceful error messages
- Retry capability
- Validation feedback

## Storage Service API

### Upload Functions

```typescript
// Upload property image
StorageService.uploadPropertyImage(file: File, propertyId?: number): Promise<string>

// Upload multiple property images
StorageService.uploadPropertyImages(files: File[], propertyId?: number): Promise<string[]>

// Upload agent avatar
StorageService.uploadAgentAvatar(file: File, agentId?: string): Promise<string>

// Upload profile avatar
StorageService.uploadProfileAvatar(file: File, userId: string): Promise<string>

// Upload property document
StorageService.uploadPropertyDocument(file: File, propertyId: number, docType: string): Promise<string>

// Upload client document
StorageService.uploadClientDocument(file: File, clientId: number): Promise<string>
```

### Utility Functions

```typescript
// Validate file size
StorageService.validateFileSize(file: File, maxSizeMB: number): boolean

// Validate file type
StorageService.validateFileType(file: File, allowedTypes: string[]): boolean

// Compress image
storageUtils.compressImage(file: File, maxWidth: number, quality: number): Promise<File>

// Convert to base64
storageUtils.fileToBase64(file: File): Promise<string>

// Format file size
storageUtils.formatFileSize(bytes: number): string
```

## Security Features

### Row Level Security (RLS)
- **property-images**: Anyone can view, authenticated users can upload
- **agent-avatars**: Anyone can view, agents can upload their own
- **property-documents**: Private, requires authentication
- **client-documents**: Private, restricted to authorized users

### Storage Policies
The migration has set up proper RLS policies:
- Public buckets for images that need to be displayed publicly
- Private buckets for sensitive documents
- User-specific upload permissions

## Integration Examples

### 1. Agent Avatar Upload
```jsx
const handleImageUpload = async (file) => {
  // Validate
  if (!StorageService.validateFileSize(file, 2)) {
    alert("File too large");
    return;
  }
  
  // Compress
  const compressed = await storageUtils.compressImage(file, 800, 0.8);
  
  // Upload
  const url = await StorageService.uploadAgentAvatar(compressed, agentId);
  
  // Save URL to database
  updateAgent({ avatar_url: url });
};
```

### 2. Property Gallery Upload
```jsx
const handlePropertyImages = async (files) => {
  const urls = await StorageService.uploadPropertyImages(files, propertyId);
  updateProperty({ images: urls });
};
```

### 3. Document Upload
```jsx
const handleDocumentUpload = async (file) => {
  const url = await StorageService.uploadPropertyDocument(
    file,
    propertyId,
    'floor_plan'
  );
  updateProperty({ floor_plan_url: url });
};
```

## Troubleshooting

### Common Issues

1. **"Failed to upload image"**
   - Check internet connection
   - Verify Supabase project is active
   - Ensure storage buckets exist

2. **"File too large"**
   - Compress images before upload
   - Check file size limits in bucket settings

3. **"Invalid file type"**
   - Only upload supported formats
   - Check MIME type restrictions

4. **"Permission denied"**
   - Ensure user is authenticated
   - Check RLS policies are enabled

### Testing Upload

1. Go to **Add Agent** page
2. Click on upload button
3. Select an image (< 2MB, JPEG/PNG)
4. Image should upload and display

## Next Steps

To fully integrate image upload:

1. **Update AddProperty component** to use ImageUpload component
2. **Add document upload** to property forms
3. **Enable profile picture** upload in user settings
4. **Add image gallery** viewer for properties
5. **Implement image reordering** with drag-and-drop

## Notes

- Images are automatically served via Supabase CDN
- Public images have permanent URLs
- Private documents use signed URLs with expiry
- Storage is included in Supabase free tier (1GB)
- Consider implementing image lazy loading for performance