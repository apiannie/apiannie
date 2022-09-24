import {
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  Input,
  InputProps,
} from "@chakra-ui/react";
import { useField } from "remix-validated-form";

export interface FormInputProps extends InputProps {
  name: string;
  label: string;
}

export default function FormInput({ name, label, ...rest }: FormInputProps) {
  const { error, getInputProps } = useField(name);
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Input {...getInputProps({ id: name, ...rest })} />
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}
    </FormControl>
  );
}
