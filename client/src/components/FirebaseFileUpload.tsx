import { useState, useRef } from 'react';import { useState, useRef } from 'react';import { useState, useRef } from 'react';

import { Button } from '@/components/ui/button';

import { Progress } from '@/components/ui/progress';import { Button } from '@/components/ui/button';import { Button } from '@/components/ui/button';

import { supabase } from '@/lib/supabase';

import { useAuth } from '@/contexts/AuthContext';import { Progress } from '@/components/ui/progress';import { Progress } from '@/components/ui/progress';

import { useToast } from '@/hooks/use-toast';

import { Upload, X, FileIcon } from 'lucide-react';import { supabase } from '@/lib/supabase';import { supabase } from '@/lib/supabase';



interface FirebaseFileUploadProps {import { useAuth } from '@/contexts/AuthContext';import { useAuth } from '@/contexts/AuthContext';

  onUpload: (url: string, fileName: string, filePath: string) => void;

  onError?: (error: Error) => void;import { useToast } from '@/hooks/use-toast';import { useToast } from '@/hooks/use-toast';

  maxSize?: number;

  acceptedTypes?: string[];import { Upload, X, FileIcon } from 'lucide-react';import { Upload, X, FileIcon } from 'lucide-react';

  className?: string;

  disabled?: boolean;

  bucket?: string;

  folder?: string;interface FileUploadProps {interface FirebaseFileUploadProps {

}

  onUpload: (url: string, fileName: string, filePath: string) => void;  onUpload: (url: string, fileName: string, filePath: string) => void;

export const FirebaseFileUpload = ({

  onUpload,  onError?: (error: Error) => void;  onError?: (error: Error) => void;

  onError,

  maxSize = 10,  maxSize?: number;  maxSize?: number;

  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],

  className = '',  acceptedTypes?: string[];  acceptedTypes?: string[];

  disabled = false,

  bucket = 'materials',  className?: string;  className?: string;

  folder = 'uploads',

}: FirebaseFileUploadProps) => {  disabled?: boolean;  disabled?: boolean;

  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);  bucket?: string;  bucket?: string;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);  folder?: string;  folder?: string;

  const { user } = useAuth();

  const { toast } = useToast();}}



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (!file) return;export const FileUpload = ({export const FirebaseFileUpload = ({



    if (file.size > maxSize * 1024 * 1024) {  onUpload,  onUpload,

      toast({

        title: "File too large",  onError,  onError,

        description: `File size must be less than ${maxSize}MB`,

        variant: "destructive",  maxSize = 10,  maxSize = 10,

      });

      return;  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],

    }

  className = '',  className = '',

    setSelectedFile(file);

  };  disabled = false,  disabled = false,



  const handleUpload = async () => {  bucket = 'materials',  bucket = 'materials',

    if (!selectedFile || !user) {

      toast({  folder = 'uploads',  folder = 'uploads',

        title: "Upload failed",

        description: "Please select a file and ensure you're logged in",}: FileUploadProps) => {}: FirebaseFileUploadProps) => {

        variant: "destructive",

      });  const [uploading, setUploading] = useState(false);  const [uploading, setUploading] = useState(false);

      return;

    }  const [uploadProgress, setUploadProgress] = useState(0);  const [uploadProgress, setUploadProgress] = useState(0);



    setUploading(true);  const [selectedFile, setSelectedFile] = useState<File | null>(null);  const [selectedFile, setSelectedFile] = useState<File | null>(null);

    setUploadProgress(0);

  const fileInputRef = useRef<HTMLInputElement>(null);  const fileInputRef = useRef<HTMLInputElement>(null);

    try {

      // Create unique file path: userId/folder/timestamp-filename  const { user } = useAuth();  const { user } = useAuth();

      const timestamp = Date.now();

      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');  const { toast } = useToast();  const { toast } = useToast();

      const filePath = `${user.id}/${folder}/${timestamp}-${sanitizedFileName}`;



      // Upload file to Supabase Storage

      const { data, error } = await supabase.storage  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {

        .from(bucket)

        .upload(filePath, selectedFile, {    const file = event.target.files?.[0];    const file = event.target.files?.[0];

          cacheControl: '3600',

          upsert: false    if (!file) return;    if (!file) return;

        });



      if (error) {

        throw error;    if (file.size > maxSize * 1024 * 1024) {    if (file.size > maxSize * 1024 * 1024) {

      }

      toast({      toast({

      // Get the public URL for the uploaded file

      const { data: { publicUrl } } = supabase.storage        title: "File too large",        title: "File too large",

        .from(bucket)

        .getPublicUrl(filePath);        description: `File size must be less than ${maxSize}MB`,        description: `File size must be less than ${maxSize}MB`,



      setUploadProgress(100);        variant: "destructive",        variant: "destructive",



      toast({      });      });

        title: "Upload successful",

        description: `${selectedFile.name} has been uploaded successfully.`,      return;      return;

      });

    }    }

      onUpload(publicUrl, selectedFile.name, filePath);

      setSelectedFile(null);

      setUploadProgress(0);

          setSelectedFile(file);    setSelectedFile(file);

      // Reset file input

      if (fileInputRef.current) {  };  };

        fileInputRef.current.value = '';

      }

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Upload failed';  const handleUpload = async () => {  const handleUpload = async () => {

      console.error('Upload error:', error);

          if (!selectedFile || !user) {    if (!selectedFile || !user) {

      toast({

        title: "Upload failed",      toast({      toast({

        description: errorMessage,

        variant: "destructive",        title: "Upload failed",        title: "Upload failed",

      });

              description: "Please select a file and ensure you're logged in",        description: "Please select a file and ensure you're logged in",

      onError?.(error instanceof Error ? error : new Error(errorMessage));

    } finally {        variant: "destructive",        variant: "destructive",

      setUploading(false);

    }      });      });

  };

      return;      return;

  const clearSelection = () => {

    setSelectedFile(null);    }    }

    if (fileInputRef.current) {

      fileInputRef.current.value = '';

    }

  };    setUploading(true);    setUploading(true);



  return (    setUploadProgress(0);    setUploadProgress(0);

    <div className={`space-y-4 ${className}`}>

      <div className="flex items-center gap-2">

        <Button

          type="button"    try {    try {

          variant="outline"

          onClick={() => fileInputRef.current?.click()}      // Create unique file path: userId/folder/timestamp-filename      // Create unique file path: userId/folder/timestamp-filename

          disabled={disabled || uploading}

          className="flex items-center gap-2"      const timestamp = Date.now();      const timestamp = Date.now();

          data-testid="file-select-button"

        >      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');

          <Upload className="h-4 w-4" />

          Select File      const filePath = `${user.id}/${folder}/${timestamp}-${sanitizedFileName}`;      const filePath = `${user.id}/${folder}/${timestamp}-${sanitizedFileName}`;

        </Button>



        <input

          ref={fileInputRef}      // Upload file to Supabase Storage      // Upload file to Supabase Storage

          type="file"

          onChange={handleFileSelect}      const { data, error } = await supabase.storage      const { data, error } = await supabase.storage

          accept={acceptedTypes.join(',')}

          className="hidden"        .from(bucket)        .from(bucket)

          disabled={disabled || uploading}

          data-testid="file-input"        .upload(filePath, selectedFile, {        .upload(filePath, selectedFile, {

        />

          cacheControl: '3600',          cacheControl: '3600',

        {selectedFile && (

          <Button          upsert: false          upsert: false

            type="button"

            variant="default"        });        });

            onClick={handleUpload}

            disabled={uploading}

            data-testid="upload-button"

          >      if (error) {      if (error) {

            {uploading ? 'Uploading...' : 'Upload'}

          </Button>        throw error;        throw error;

        )}

      </div>      }      }



      {selectedFile && (

        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">

          <FileIcon className="h-4 w-4" />      // Get the public URL for the uploaded file      // Get the public URL for the uploaded file

          <span className="flex-1 text-sm truncate">{selectedFile.name}</span>

          <span className="text-xs text-muted-foreground">      const { data: { publicUrl } } = supabase.storage      const { data: { publicUrl } } = supabase.storage

            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB

          </span>        .from(bucket)        .from(bucket)

          {!uploading && (

            <Button        .getPublicUrl(filePath);        .getPublicUrl(filePath);

              type="button"

              variant="ghost"

              size="sm"

              onClick={clearSelection}      setUploadProgress(100);      setUploadProgress(100);

              data-testid="clear-file-button"

            >

              <X className="h-4 w-4" />

            </Button>      toast({      toast({

          )}

        </div>        title: "Upload successful",        title: "Upload successful",

      )}

        description: `${selectedFile.name} has been uploaded successfully.`,        description: `${selectedFile.name} has been uploaded successfully.`,

      {uploading && (

        <div className="space-y-2">      });      });

          <Progress value={uploadProgress} className="w-full" />

          <p className="text-sm text-muted-foreground text-center">

            Uploading... {uploadProgress}%

          </p>      onUpload(publicUrl, selectedFile.name, filePath);      onUpload(publicUrl, selectedFile.name, filePath);

        </div>

      )}      setSelectedFile(null);      setSelectedFile(null);

    </div>

  );      setUploadProgress(0);      setUploadProgress(0);

};
            

      // Reset file input      // Reset file input

      if (fileInputRef.current) {      if (fileInputRef.current) {

        fileInputRef.current.value = '';        fileInputRef.current.value = '';

      }      }

    } catch (error) {    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Upload failed';      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      console.error('Upload error:', error);      console.error('Upload error:', error);

            

      toast({      toast({

        title: "Upload failed",        title: "Upload failed",

        description: errorMessage,        description: errorMessage,

        variant: "destructive",        variant: "destructive",

      });      });

            

      onError?.(error instanceof Error ? error : new Error(errorMessage));      onError?.(error instanceof Error ? error : new Error(errorMessage));

    } finally {    } finally {

      setUploading(false);      setUploading(false);

    }    }

  };  };



  const clearSelection = () => {  const clearSelection = () => {

    setSelectedFile(null);    setSelectedFile(null);

    if (fileInputRef.current) {    if (fileInputRef.current) {

      fileInputRef.current.value = '';      fileInputRef.current.value = '';

    }    }

  };  };



  return (  return (

    <div className={`space-y-4 ${className}`}>    <div className={`space-y-4 ${className}`}>

      <div className="flex items-center gap-2">      <div className="flex items-center gap-2">

        <Button        <Button

          type="button"          type="button"

          variant="outline"          variant="outline"

          onClick={() => fileInputRef.current?.click()}          onClick={() => fileInputRef.current?.click()}

          disabled={disabled || uploading}          disabled={disabled || uploading}

          className="flex items-center gap-2"          className="flex items-center gap-2"

          data-testid="file-select-button"          data-testid="file-select-button"

        >        >

          <Upload className="h-4 w-4" />          <Upload className="h-4 w-4" />

          Select File          Select File

        </Button>        </Button>



        <input        <input

          ref={fileInputRef}          ref={fileInputRef}

          type="file"          type="file"

          onChange={handleFileSelect}          onChange={handleFileSelect}

          accept={acceptedTypes.join(',')}          accept={acceptedTypes.join(',')}

          className="hidden"          className="hidden"

          disabled={disabled || uploading}          disabled={disabled || uploading}

          data-testid="file-input"          data-testid="file-input"

        />        />



        {selectedFile && (        {selectedFile && (

          <Button          <Button

            type="button"            type="button"

            variant="default"            variant="default"

            onClick={handleUpload}            onClick={handleUpload}

            disabled={uploading}            disabled={uploading}

            data-testid="upload-button"            data-testid="upload-button"

          >          >

            {uploading ? 'Uploading...' : 'Upload'}            {uploading ? 'Uploading...' : 'Upload'}

          </Button>          </Button>

        )}        )}

      </div>      </div>



      {selectedFile && (      {selectedFile && (

        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">

          <FileIcon className="h-4 w-4" />          <FileIcon className="h-4 w-4" />

          <span className="flex-1 text-sm truncate">{selectedFile.name}</span>          <span className="flex-1 text-sm truncate">{selectedFile.name}</span>

          <span className="text-xs text-muted-foreground">          <span className="text-xs text-muted-foreground">

            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB

          </span>          </span>

          {!uploading && (          {!uploading && (

            <Button            <Button

              type="button"              type="button"

              variant="ghost"              variant="ghost"

              size="sm"              size="sm"

              onClick={clearSelection}              onClick={clearSelection}

              data-testid="clear-file-button"              data-testid="clear-file-button"

            >            >

              <X className="h-4 w-4" />              <X className="h-4 w-4" />

            </Button>            </Button>

          )}          )}

        </div>        </div>

      )}      )}



      {uploading && (      {uploading && (

        <div className="space-y-2">        <div className="space-y-2">

          <Progress value={uploadProgress} className="w-full" />          <Progress value={uploadProgress} className="w-full" />

          <p className="text-sm text-muted-foreground text-center">          <p className="text-sm text-muted-foreground text-center">

            Uploading... {uploadProgress}%            Uploading... {uploadProgress}%

          </p>          </p>

        </div>        </div>

      )}      )}

    </div>    </div>

  );  );

};};terface FirebaseFileUploadProps {

  onUpload: (url: string, fileName: string, filePath: string) => void;

// Legacy export for backward compatibility  onError?: (error: Error) => void;

export const FirebaseFileUpload = FileUpload;  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  bucket?: string;
  folder?: string;
}e, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileIcon } from 'lucide-react';

interface FirebaseFileUploadProps {
  onUpload: (url: string, fileName: string) => void;
  onError?: (error: Error) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export const FirebaseFileUpload = ({
  onUpload,
  onError,
  maxSize = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  className = '',
  disabled = false,
}: FirebaseFileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `uploads/${timestamp}_${sanitizedFileName}`;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const downloadURL = await uploadFile(selectedFile, filePath);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Upload successful",
        description: `${selectedFile.name} has been uploaded successfully.`,
      });

      onUpload(downloadURL, selectedFile.name);
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('Upload error:', error);
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center gap-2"
          data-testid="file-select-button"
        >
          <Upload className="h-4 w-4" />
          Select File
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          className="hidden"
          disabled={disabled || uploading}
          data-testid="file-input"
        />

        {selectedFile && (
          <Button
            type="button"
            variant="default"
            onClick={handleUpload}
            disabled={uploading}
            data-testid="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        )}
      </div>

      {selectedFile && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <FileIcon className="h-4 w-4" />
          <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </span>
          {!uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              data-testid="clear-file-button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};