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

export interface FormInputProps extends InputProps {
  name: string;
  label?: string;
}

export default React.forwardRef<HTMLInputElement, FormInputProps>(
  (props, ref) => {
    const { name, label, children, ...rest } = props;
    const { error, getInputProps } = useField(name);
    return (
      <FormControl>
        {label && <FormLabel>{label}</FormLabel>}
        <InputGroup>
          <Input ref={ref} {...getInputProps({ id: name, ...rest })} />
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
