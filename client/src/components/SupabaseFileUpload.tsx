import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileIcon } from 'lucide-react';

interface SupabaseFileUploadProps {
  onUpload: (url: string, fileName: string, filePath: string) => void;
  onError?: (error: Error) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  bucket?: string;
  folder?: string;
}

export const SupabaseFileUpload = ({
  onUpload,
  onError,
  maxSize = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  className = '',
  disabled = false,
  bucket = 'materials',
  folder = 'uploads',
}: SupabaseFileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast({
        title: "Upload failed",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create unique file path: userId/folder/timestamp-filename
      const timestamp = Date.now();
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${folder}/${timestamp}-${sanitizedFileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUploadProgress(100);

      toast({
        title: "Upload successful",
        description: `File "${selectedFile.name}" uploaded successfully`,
      });

      onUpload(publicUrl, selectedFile.name, filePath);
      
      // Reset state
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Select File
        </Button>
        
        <span className="text-sm text-gray-500">
          Max {maxSize}MB • {acceptedTypes.join(', ')}
        </span>
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <FileIcon className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium text-sm">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!uploading && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={disabled}
                  className="flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
};