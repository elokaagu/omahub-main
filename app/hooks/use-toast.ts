import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

export const useToast = () => {
  const toast = ({ message, type = "info", duration = 3000 }: ToastProps) => {
    switch (type) {
      case "success":
        sonnerToast.success(message, { duration });
        break;
      case "error":
        sonnerToast.error(message, { duration });
        break;
      case "warning":
        sonnerToast.warning(message, { duration });
        break;
      default:
        sonnerToast(message, { duration });
    }
  };

  return { toast };
};

export { toast } from "sonner";
