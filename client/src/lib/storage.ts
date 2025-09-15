import { supabase } from "./supabase";

export interface UploadProgress {
  progress: number;
  fileName: string;
  url?: string;
}

export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    if (onProgress) {
      onProgress({ progress: 0, fileName: file.name });
    }
    
    // Create unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${path}/${timestamp}-${sanitizedFileName}`;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    if (onProgress) {
      onProgress({ progress: 100, fileName: file.name });
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath);
    
    if (onProgress) {
      onProgress({ progress: 100, fileName: file.name, url: publicUrl });
    }
    
    return publicUrl;
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};

export const uploadMultipleFiles = async (
  files: File[],
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadFile(file, path, onProgress));
  return Promise.all(uploadPromises);
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from('materials')
      .remove([filePath]);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("File deletion error:", error);
    throw error;
  }
};

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 20MB" };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not supported. Please upload PDF, Word, PowerPoint, or Excel files." };
  }
  
  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
