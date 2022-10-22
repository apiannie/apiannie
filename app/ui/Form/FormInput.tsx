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
  formId?: string;
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
    formId,
    defaultValue,
    defaultChecked,
    isRequired,
    ...rest
  } = props;
  const { error, getInputProps } = useField(name, { formId });
  let inputProps = getInputProps(rest);

  return (
    <FormControl isRequired={isRequired} {...container}>
      {label && <FormLabel>{label}</FormLabel>}
      <InputGroup>
        <Box
          id={id || name}
          ref={ref}
          as={as || Input}
          size={size}
          isDisabled={isDisabled}
          defaultChecked={defaultChecked}
          defaultValue={defaultValue}
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
