import {
  Alert,
  AlertIcon,
  BackgroundProps,
  Box,
  ChakraProps,
  Flex,
  FormControl,
  FormControlProps,
  FormLabel,
  forwardRef,
  Input,
  InputProps,
  StyleProps,
  ThemingProps,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { useField } from "remix-validated-form";
import { MinimalInputProps } from "./type";

export interface FormInputProps
  extends InputProps,
    Pick<React.HTMLProps<HTMLButtonElement>, "autoComplete"> {
  name: string;
  label?: string;
  container?: FormControlProps;
  labelWidth: string;
  isRequired?: boolean;
}

const FormHInput = forwardRef<FormInputProps, "input">((props, ref) => {
  const { name, isRequired, container, labelWidth, label, size, as, ...rest } =
    props;
  const { error, getInputProps } = useField(name);

  return (
    <FormControl
      isRequired={isRequired}
      flexDir="column"
      display={"flex"}
      alignItems="center"
      gap={2}
      {...container}
    >
      <Flex alignItems={"center"} justifyContent="end" w="full">
        <Box flexBasis={labelWidth} flexShrink={0}>
          <FormLabel textAlign={"right"} m={0} mr={4}>
            {label}
          </FormLabel>
        </Box>
        {React.createElement(as || Input, {
          size: size,
          ref: ref,
          ...getInputProps(rest),
        })}
      </Flex>
      {error && (
        <Box w="full" pl={labelWidth}>
          <Alert size={size} status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Box>
      )}
    </FormControl>
  );
});

export default FormHInput;
