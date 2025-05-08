// This is a custom hook to use the toast functionality from sonner
import { toast as sonnerToast, type ExternalToast } from "sonner";

// Define the return type of the hook
export interface UseToastReturn {
  toast: typeof sonnerToast;
  dismiss: (toastId?: string | number) => void;
}

// Define the parameter type for toast function
export type ToastProps = ExternalToast & {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
};

export function useToast(): UseToastReturn {
  return {
    toast: sonnerToast,
    dismiss: sonnerToast.dismiss,
  };
}

export type { ExternalToast }; 