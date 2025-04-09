'use client'

import * as React from 'react'
import { useCallback, useState } from 'react'
import { useDropzone, type FileWithPath } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { UploadCloud, File, X, FileText, FileImage, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  id?: string
  accept?: Record<string, string[]>
  multiple?: boolean
  onFilesSelected?: (files: File[]) => void
  required?: boolean
  label?: string
}

export function FileUploader({
  className,
  id = 'file-upload',
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
  multiple = true,
  onFilesSelected,
  required = false,
  label,
  ...props
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      const newFiles = multiple ? [...files, ...acceptedFiles] : acceptedFiles;
      setFiles(newFiles)
      onFilesSelected?.(newFiles)
      setIsDragging(false)
    },
    [files, multiple, onFilesSelected]
  )

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesSelected?.(newFiles);
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    } else if (file.type.includes('word')) {
      return <FileText className="h-5 w-5 text-blue-600" />
    } else {
      return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const acceptedFileTypes = Object.values(accept).flat().join(', ');

  return (
    <div className={cn('space-y-4', className)} {...props}>
      <div
        {...getRootProps()}
        className={cn(
          'group relative rounded-lg border-2 border-dashed transition-all duration-200 ease-in-out',
          isDragActive 
            ? 'border-primary/70 bg-primary/5 shadow-sm' 
            : 'border-muted-foreground/20 bg-muted/30 hover:bg-muted/50',
          files.length > 0 && !isDragActive ? 'border-green-500/40 bg-green-50/30 dark:bg-green-950/10' : '',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
      >
        <input {...getInputProps({ id })} />
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className={cn(
            'rounded-full p-3 mb-3',
            isDragActive ? 'bg-primary/10' : 'bg-muted/70',
            files.length > 0 && !isDragActive ? 'bg-green-100 dark:bg-green-900/20' : ''
          )}>
            {files.length > 0 && !isDragActive ? (
              <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
            ) : (
              <UploadCloud
                className={cn(
                  'h-7 w-7 transition-all duration-200 ease-in-out',
                  isDragActive ? 'scale-110 text-primary' : 'text-muted-foreground',
                )}
              />
            )}
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {isDragActive ? (
                <span className="text-primary">Drop files here</span>
              ) : files.length > 0 ? (
                <span className="text-green-600 dark:text-green-400">
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                </span>
              ) : (
                <>
                  <span className="text-primary">Click to upload</span>{' '}
                  <span className="text-muted-foreground">or drag and drop</span>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {Object.entries(accept).map(([mime, exts], idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-muted/50">
                  {exts.join(', ')}
                </Badge>
              ))}
            </div>
            
            {required && (
              <p className="text-xs text-primary mt-2">
                * Required
              </p>
            )}
            
            {label && (
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            )}
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="divide-y">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="flex flex-col">
                    <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}