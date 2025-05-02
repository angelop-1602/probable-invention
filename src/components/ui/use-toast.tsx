// This is a custom hook to use the toast functionality from sonner
import { toast, type ExternalToast } from "sonner";

// Define the return type of the hook
export interface UseToastReturn {
  toast: typeof toast;
  dismiss: (toastId?: string | number) => void;
}

// Define the parameter type for toast function
export type ToastProps = ExternalToast & {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
};

export function useToast(): UseToastReturn {
  return {
    toast,
    dismiss: toast.dismiss,
  };
}

export type { ExternalToast }; 