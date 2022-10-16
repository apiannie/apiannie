import {
  Alert,
  AlertIcon,
  Box,
  Checkbox,
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
  const {
    id,
    name,
    label,
    children,
    as,
    container,
    size,
    isDisabled,
    ...rest
  } = props;
  const { error, getInputProps } = useField(name);
  let inputProps = getInputProps(rest);

  // console.log({ ...inputProps });

  if (as === Checkbox) {
    inputProps.defaultChecked = !!inputProps.defaultValue;
  }
  return (
    <FormControl {...container}>
      {label && <FormLabel>{label}</FormLabel>}
      <InputGroup>
        <Box
          id={id || name}
          ref={ref}
          as={as || Input}
          size={size}
          isDisabled={isDisabled}
          {...inputProps}
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
