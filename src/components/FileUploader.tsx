import { useState, useCallback } from 'react';
import { Upload, FileText, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface FileUploaderProps {
  onFilesUploaded?: (files: File[]) => Promise<void>;
}

export const FileUploader = ({ onFilesUploaded }: FileUploaderProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF and CSV files are allowed';
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return 'File size must be less than 50MB';
    }
    
    return null;
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const validFiles: File[] = [];
    const newFiles: UploadedFile[] = [];

    Array.from(fileList).forEach((file) => {
      const error = validateFile(file);
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: error ? 'error' : 'uploading',
        progress: 0,
        error,
      };

      newFiles.push(uploadedFile);
      if (!error) {
        validFiles.push(file);
      }
    });

    setFiles(prev => [...prev, ...newFiles]);

    if (validFiles.length === 0) {
      toast({
        title: "Upload Error",
        description: "No valid files to upload",
        variant: "destructive",
      });
      return;
    }

    // Process files with Supabase
    for (const file of validFiles) {
      const correspondingFileData = newFiles.find(f => f.name === file.name);
      if (!correspondingFileData) continue;

      try {
        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          setFiles(prev => prev.map(f => 
            f.id === correspondingFileData.id 
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          ));
          continue;
        }

        setFiles(prev => prev.map(f => 
          f.id === correspondingFileData.id 
            ? { ...f, status: 'processing', progress: 50 }
            : f
        ));

        // Process file with edge function
        const { data: processResult, error: processError } = await supabase.functions
          .invoke('process-file', {
            body: {
              fileName: file.name,
              fileUrl: fileName,
              fileType: file.type
            }
          });

        if (processError) {
          console.error('Processing error:', processError);
          setFiles(prev => prev.map(f => 
            f.id === correspondingFileData.id 
              ? { ...f, status: 'error', error: 'Processing failed' }
              : f
          ));
        } else {
          console.log('File processed successfully:', processResult);
          setFiles(prev => prev.map(f => 
            f.id === correspondingFileData.id 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          ));
        }
      } catch (error) {
        console.error('Error processing file:', error);
        setFiles(prev => prev.map(f => 
          f.id === correspondingFileData.id 
            ? { ...f, status: 'error', error: 'Processing error' }
            : f
        ));
      }
    }

    if (onFilesUploaded) {
      try {
        await onFilesUploaded(validFiles);
        toast({
          title: "Files Processed",
          description: `Successfully processed ${validFiles.length} file(s)`,
        });
      } catch (error) {
        console.error('Error in onFilesUploaded callback:', error);
      }
    }
  };

  const simulateUpload = async (fileId: string) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress, status: progress === 100 ? 'processing' : 'uploading' }
          : f
      ));
    }

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'completed', progress: 100 }
        : f
    ));
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    e.target.value = ''; // Reset input
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    const variants: Record<UploadedFile['status'], 'default' | 'secondary' | 'destructive'> = {
      uploading: 'secondary',
      processing: 'secondary',
      completed: 'default',
      error: 'destructive',
    };

    const labels: Record<UploadedFile['status'], string> = {
      uploading: 'Uploading',
      processing: 'Processing',
      completed: 'Ready',
      error: 'Error',
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  return (
    <Card className="p-6 glass">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Upload Data Files</h3>
          <p className="text-sm text-muted-foreground">
            Upload CSV or PDF files to analyze with the RAG system
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="text-lg font-medium mb-2">Drop files here or click to upload</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Supports CSV and PDF files up to 50MB
          </p>
          <input
            type="file"
            multiple
            accept=".csv,.pdf,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button variant="outline" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Uploaded Files</h4>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50"
                >
                  {getStatusIcon(file.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                      {getStatusBadge(file.status)}
                    </div>
                    
                    {file.status === 'uploading' || file.status === 'processing' ? (
                      <Progress value={file.progress} className="mt-2 h-1" />
                    ) : null}
                    
                    {file.error && (
                      <p className="text-xs text-destructive mt-1">{file.error}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};