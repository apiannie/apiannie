import { Button, ButtonProps } from "@chakra-ui/react";
import { useIsSubmitting } from "remix-validated-form";

export interface FormButtonProps extends ButtonProps {}

export default function FormSubmitButton({
  isLoading,
  loadingText,
  type,
  ...rest
}: FormButtonProps) {
  const isSubmitting = useIsSubmitting();
  return (
    <Button
      type="submit"
      isLoading={isSubmitting}
      loadingText={loadingText || "Submitting"}
      {...rest}
    />
  );
}
