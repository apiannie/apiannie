import { Button, ButtonProps } from "@chakra-ui/react";
import { useIsSubmitting } from "remix-validated-form";

export interface FormButtonProps extends ButtonProps {}

export default function FormSubmitButton({
  isLoading,
  loadingText,
  ...rest
}: FormButtonProps) {
  const isSubmitting = useIsSubmitting();
  return (
    <Button
      isLoading={isSubmitting}
      loadingText={loadingText || "Submitting"}
      {...rest}
    />
  );
}
