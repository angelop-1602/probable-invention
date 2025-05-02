import * as React from 'react';
import { cn } from '@/lib/utils';

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  children: React.ReactNode;
}

const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ orientation = 'horizontal', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col' : 'flex-row items-start',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Steps.displayName = 'Steps';

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  completed?: boolean;
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ active, completed, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex',
          className,
          active && 'text-primary',
          completed && 'text-primary/80'
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Step.displayName = 'Step';

export { Steps, Step }; 