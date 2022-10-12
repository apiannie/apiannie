import {
  Alert,
  AlertIcon,
  BackgroundProps,
  Box,
  ChakraProps,
  Flex,
  FormControl,
  FormLabel,
  StyleProps,
  ThemingProps,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { useField } from "remix-validated-form";
import { MinimalInputProps } from "./type";

const FormHInput = <T extends React.FunctionComponent>({
  name,
  label,
  labelWidth,
  as,
  isRequired,
  bg,
  ...rest
}: {
  name: string;
  label: string;
  labelWidth: string;
  isRequired?: boolean;
  as: T;
} & ThemingProps &
  BackgroundProps &
  MinimalInputProps &
  Omit<React.HTMLProps<HTMLInputElement>, "size" | "autoCompolete" | "as">) => {
  const { error, getInputProps } = useField(name);
  return (
    <FormControl
      isRequired={isRequired}
      flexDir="column"
      display={"flex"}
      alignItems="center"
      gap={2}
    >
      <Flex alignItems={"center"} justifyContent="end" w="full">
        <Box flexBasis={labelWidth} flexShrink={0}>
          <FormLabel textAlign={"right"} m={0} mr={4}>
            {label}
          </FormLabel>
        </Box>
        {React.createElement(as, {
          id: name,
          flexGrow: 1,
          bg: bg,
          ...getInputProps(rest),
        })}
      </Flex>
      {error && (
        <Box w="full" pl={labelWidth}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Box>
      )}
    </FormControl>
  );
};

export default FormHInput;
