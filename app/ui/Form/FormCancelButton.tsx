import { Button, ButtonProps } from "@chakra-ui/react";
import { useIsSubmitting } from "remix-validated-form";

export interface FormCancelButtonProps extends ButtonProps {}

export default function FormCancelButton({
  disabled,
  ...rest
}: FormCancelButtonProps) {
  const isSubmitting = useIsSubmitting();
  return <Button disabled={isSubmitting} {...rest} />;
}
