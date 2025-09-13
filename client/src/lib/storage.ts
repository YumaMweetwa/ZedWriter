import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

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
    const storageRef = ref(storage, `${path}/${file.name}`);
    
    if (onProgress) {
      onProgress({ progress: 0, fileName: file.name });
    }
    
    const snapshot = await uploadBytes(storageRef, file);
    
    if (onProgress) {
      onProgress({ progress: 100, fileName: file.name });
    }
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    if (onProgress) {
      onProgress({ progress: 100, fileName: file.name, url: downloadURL });
    }
    
    return downloadURL;
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

export const deleteFile = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
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
