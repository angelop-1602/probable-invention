'use client'

import * as React from 'react'
import { useCallback, useState } from 'react'
import { useDropzone, type FileWithPath } from 'react-dropzone'
import { cn } from '@/lib/utils' // Assuming you have utility classes
import { Button } from '@/components/ui/button'
import { UploadCloud, File, X } from 'lucide-react'

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  id?: string
  accept?: Record<string, string[]>
  multiple?: boolean
  onFilesSelected?: (files: File[]) => void
}

export function FileUploader({
  className,
  id = 'file-upload',
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
  multiple = true,
  onFilesSelected,
  ...props
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      setFiles(acceptedFiles)
      onFilesSelected?.(acceptedFiles)
      setIsDragging(false)
    },
    [onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  return (
    <div className={cn('space-y-4', className)} {...props}>
      <div
        {...getRootProps()}
        className={cn(
          'group relative rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/50 transition-colors duration-200 ease-in-out',
          isDragActive && 'border-primary/50 bg-primary/10',
          'hover:bg-muted/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
      >
        <input {...getInputProps({ id })} />
        <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <UploadCloud
              className={cn(
                'h-8 w-8 text-muted-foreground transition-all duration-200 ease-in-out',
                isDragActive && 'scale-110 text-primary'
              )}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {isDragActive ? (
                <span className="text-primary">Drop files here</span>
              ) : (
                <>
                  <span className="text-primary">Click to upload</span>{' '}
                  <span className="text-muted-foreground">or drag and drop</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.values(accept)
                .flat()
                .join(', ')}
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border bg-background p-4"
            >
              <div className="flex items-center space-x-4">
                <File className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setFiles(files.filter((_, i) => i !== index))
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
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