import {
  Alert,
  AlertIcon,
  ComponentWithAs,
  FormControl,
  FormControlProps,
  FormLabel,
  forwardRef,
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
  container?: FormControlProps;
}

const FormInput = forwardRef<FormInputProps, "input">((props, ref) => {
  const { id, name, label, children, as, container, size, ...rest } = props;
  const { error, getInputProps } = useField(name);

  return (
    <FormControl {...container}>
      {label && <FormLabel>{label}</FormLabel>}
      <InputGroup>
        <Input
          id={id || name}
          ref={ref}
          as={as}
          size={size}
          {...getInputProps({ ...rest })}
        />
        {children}
      </InputGroup>
      {error && (
        <Alert status="error" size={size}>
          <AlertIcon />
          {error}
        </Alert>
      )}
    </FormControl>
  );
});

export default FormInput;
