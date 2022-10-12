import {
  Alert,
  AlertIcon,
  FormControl,
  FormControlProps,
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
    const { id, name, label, type, children, as, size, placeholder, ...rest } =
      props;
    const { error, getInputProps } = useField(name);

    console.log(rest);

    return (
      <FormControl {...rest}>
        {label && <FormLabel>{label}</FormLabel>}
        <InputGroup>
          <Input
            id={id || name}
            ref={ref}
            as={as}
            size={size}
            placeholder={placeholder}
            {...getInputProps({ type })}
          />
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
