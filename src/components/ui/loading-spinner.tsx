'use client'

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ 
  fullScreen = false, 
  className,
  size = 'lg'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-16 w-16 border-2',
    lg: 'h-32 w-32 border-t-2 border-b-2'
  }

  const Spinner = () => (
    <div className={cn(
      "animate-spin rounded-full border-green-900",
      sizeClasses[size],
      className
    )} />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[100px]">
      <Spinner />
    </div>
  )
} 