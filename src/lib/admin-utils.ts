import { toast } from "@/hooks/use-toast";

/**
 * Helper to show a standardized success toast in the admin panel
 */
export const showSuccessToast = (title: string, description?: string) => {
  return toast({
    title,
    description,
    variant: "default",
    // Adding custom styling for success if needed
  });
};

/**
 * Helper to show a standardized error toast in the admin panel
 */
export const showErrorToast = (title: string, description?: string) => {
  return toast({
    title,
    description: description || "An unexpected error occurred. Please try again.",
    variant: "destructive",
  });
};

/**
 * Format currency for admin display (BDT)
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
};
