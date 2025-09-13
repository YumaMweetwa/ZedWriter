// Firebase Storage operations
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

import { getFirebaseStorage } from './config.js';

export class StorageManager {
  constructor() {
    this.storage = getFirebaseStorage();
  }

  async uploadFile(file, path, onProgress = null) {
    try {
      const storageRef = ref(this.storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (onProgress) {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              
              resolve({
                url: downloadURL,
                path: path,
                name: file.name,
                size: metadata.size,
                contentType: metadata.contentType
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error starting upload:', error);
      throw error;
    }
  }

  async uploadSubmissionFiles(uid, files, onProgress = null) {
    const uploadPromises = files.map((file, index) => {
      const timestamp = Date.now();
      const path = `uploads/${uid}/submissions/${timestamp}_${index}_${file.name}`;
      
      return this.uploadFile(file, path, (progress) => {
        if (onProgress) {
          onProgress(index, progress);
        }
      });
    });

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading submission files:', error);
      throw error;
    }
  }

  async uploadChatFile(uid, file, onProgress = null) {
    try {
      const timestamp = Date.now();
      const path = `uploads/${uid}/chat/${timestamp}_${file.name}`;
      
      return await this.uploadFile(file, path, onProgress);
    } catch (error) {
      console.error('Error uploading chat file:', error);
      throw error;
    }
  }

  async uploadAvatar(uid, file, onProgress = null) {
    try {
      const path = `uploads/${uid}/avatar/avatar.jpg`;
      return await this.uploadFile(file, path, onProgress);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  async uploadMaterial(uid, file, program, onProgress = null) {
    try {
      const timestamp = Date.now();
      const path = `uploads/${uid}/materials/${program}/${timestamp}_${file.name}`;
      
      return await this.uploadFile(file, path, onProgress);
    } catch (error) {
      console.error('Error uploading material:', error);
      throw error;
    }
  }

  async uploadProgramImage(program, file, onProgress = null) {
    try {
      const path = `programs/${program}/image.jpg`;
      return await this.uploadFile(file, path, onProgress);
    } catch (error) {
      console.error('Error uploading program image:', error);
      throw error;
    }
  }

  async deleteFile(path) {
    try {
      const fileRef = ref(this.storage, path);
      await deleteObject(fileRef);
      console.log('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async getFileMetadata(path) {
    try {
      const fileRef = ref(this.storage, path);
      return await getMetadata(fileRef);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  validateFile(file, options = {}) {
    const {
      maxSize = 20 * 1024 * 1024, // 20MB default
      allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'audio/webm'
      ]
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default StorageManager;
