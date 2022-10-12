import {
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputProps,
} from "@chakra-ui/react";
import React from "react";
import { useField } from "remix-validated-form";

export interface FormInputProps
  extends InputProps,
    Pick<React.HTMLProps<HTMLButtonElement>, "autoComplete"> {
  name: string;
  label?: string;
}

export default React.forwardRef<HTMLInputElement, FormInputProps>(
  (props, ref) => {
    const { id, name, label, children, ...rest } = props;
    const { error, getInputProps } = useField(name);
    return (
      <FormControl>
        {label && <FormLabel>{label}</FormLabel>}
        <InputGroup>
          <Input id={id || name} ref={ref} {...getInputProps({ ...rest })} />
          {children}
        </InputGroup>
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
      </FormControl>
    );
  }
);
