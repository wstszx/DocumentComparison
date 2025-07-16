import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { DocumentFile } from '../types';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  document?: DocumentFile;
  label: string;
  isLoading?: boolean;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  document,
  label,
  isLoading = false,
  error,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/*': ['.txt', '.md', '.rtf'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB limit
  });

  const hasError = error || fileRejections.length > 0;
  const errorMessage = error || (fileRejections[0]?.errors[0]?.message);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : hasError
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={isLoading} />
        
        {isLoading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Processing document...</p>
          </div>
        ) : hasError ? (
          <div className="space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Error loading document
            </p>
            <p className="text-xs text-red-500 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        ) : document ? (
          <div className="space-y-2">
            <File className="h-8 w-8 text-green-600 mx-auto" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {document.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(document.size / 1024).toFixed(1)} KB • {document.content.length} characters
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a document, or click to select'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supports PDF, Word, and text files (max 50MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};