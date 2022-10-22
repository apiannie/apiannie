import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  HStack,
  Text,
  Spacer,
  useColorModeValue,
} from "@chakra-ui/react";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm } from "remix-validated-form";
import { z } from "zod";
import { FormHInput, FormInput, FormSubmitButton, Header } from "~/ui";

export const action = () => {
  console.log("index");
  return null;
};

const validator = withZod(z.object({}));

export default function () {
  const labelWidth = 200;
  const bg = useColorModeValue("gray.100", "gray.700");
  const bgBW = useColorModeValue("white", "gray.900");
  return (
    <Box h="100%" overflowY={"auto"}>
      <Container maxW={"container.md"} p={8} pb={10}>
        <Header>General</Header>
        <Box
          bg={bg}
          as={ValidatedForm}
          validator={validator}
          replace
          method="patch"
          resetAfterSubmit
          p={8}
        >
          <HStack alignItems={"end"}>
            <FormInput isRequired label="Project name" name="name" bg={bgBW} />
            <Spacer />
            <FormSubmitButton
              name="_action"
              value="updateProject"
              colorScheme={"blue"}
            >
              Rename
            </FormSubmitButton>
          </HStack>
        </Box>

        <Header mt={12}>Danger Zone</Header>
        <Box
          bg={bg}
          p={8}
          as={ValidatedForm}
          validator={validator}
          replace
          method="patch"
          resetAfterSubmit
          w="full"
        >
          <HStack>
            <Flex flexDir={"column"}>
              <Text fontWeight={"medium"}>Transfer Ownership</Text>
              <Text w="full">Transfer this project to another user</Text>
            </Flex>
            <Spacer />
            <Button px={6} variant={"outline"} colorScheme={"red"}>
              Transfer
            </Button>
          </HStack>
          <HStack mt={6}>
            <Flex flexDir={"column"}>
              <Text fontWeight={"medium"}>Delete this project</Text>
              <Text w="full">
                Once you delete a project, there is no going back. Please be
                certain.
              </Text>
            </Flex>
            <Spacer />
            <Button px={6} variant={"outline"} colorScheme={"red"}>
              Delete
            </Button>
          </HStack>
        </Box>
      </Container>
    </Box>
  );
}
