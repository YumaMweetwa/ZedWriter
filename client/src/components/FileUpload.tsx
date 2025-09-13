import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  url?: string;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFiles = 6,
  maxFileSize = 20 * 1024 * 1024, // 20MB
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.slice(0, maxFiles - uploadedFiles.length).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
    }));

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    onFilesChange(updatedFiles);

    // Simulate upload progress
    newFiles.forEach(uploadedFile => {
      simulateUpload(uploadedFile);
    });
  }, [uploadedFiles, maxFiles, onFilesChange]);

  const simulateUpload = (uploadedFile: UploadedFile) => {
    const interval = setInterval(() => {
      setUploadedFiles(prev => prev.map(f => {
        if (f.id === uploadedFile.id) {
          const newProgress = Math.min(f.progress + 10, 100);
          if (newProgress === 100) {
            clearInterval(interval);
          }
          return { ...f, progress: newProgress };
        }
        return f;
      }));
    }, 200);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles: maxFiles - uploadedFiles.length,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'fas fa-file-pdf text-red-500';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word text-blue-500';
      case 'ppt':
      case 'pptx':
        return 'fas fa-file-powerpoint text-orange-500';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel text-green-500';
      default:
        return 'fas fa-file text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`file-upload-zone rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'drag-over' : ''
        } ${uploadedFiles.length >= maxFiles ? 'opacity-50 pointer-events-none' : ''}`}
        data-testid="file-upload-zone"
      >
        <input {...getInputProps()} data-testid="file-input" />
        <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </h3>
        <p className="text-muted-foreground mb-4">or click to browse</p>
        <button
          type="button"
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          data-testid="button-choose-files"
        >
          Choose Files
        </button>
        <p className="text-sm text-muted-foreground mt-4">
          Supported: {acceptedFileTypes.join(', ')} • Max {formatFileSize(maxFileSize)} each • Up to {maxFiles} files
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3" data-testid="uploaded-files-list">
          <h4 className="text-sm font-medium text-foreground">Uploaded Files</h4>
          {uploadedFiles.map(uploadedFile => (
            <div
              key={uploadedFile.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
              data-testid={`uploaded-file-${uploadedFile.id}`}
            >
              <div className="flex items-center space-x-3">
                <i className={getFileIcon(uploadedFile.file.name)} />
                <div>
                  <p className="text-sm font-medium text-foreground" data-testid="file-name">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="file-size">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadedFile.progress}%` }}
                    data-testid="file-progress"
                  />
                </div>
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="text-destructive hover:text-destructive/80 p-1"
                  data-testid="button-remove-file"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
