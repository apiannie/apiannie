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
  useToast,
} from "@chakra-ui/react";
import { ActionArgs } from "@remix-run/node";
import { Form, useMatches, useTransition } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect } from "react";
import { json } from "remix-utils";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Project, updateProject } from "~/models/project.server";
import { FormHInput, FormInput, FormSubmitButton, Header } from "~/ui";

export const action = async ({ params, request }: ActionArgs) => {
  let formData = await request.formData();
  let { projectId } = params;
  invariant(projectId);
  let action = formData.get("_action");

  if (action === "renameProject") {
    let result = await renameValidator.validate(formData);
    if (result.error) {
      return validationError(result.error);
    }
    await updateProject(projectId, { name: result.data.projectName });
  }

  return json({ success: true });
};

const renameValidator = withZod(
  z.object({
    projectName: z.string().trim().min(1, "Please input project name"),
  })
);

export default function () {
  const matches = useMatches();
  const project = matches[1].data.project as Project;
  invariant(project);
  const bg = useColorModeValue("gray.100", "gray.700");
  const bgBW = useColorModeValue("white", "gray.900");
  const transition = useTransition();
  const toast = useToast();

  useEffect(() => {
    if (transition.state === "loading") {
      let action = transition.submission?.formData?.get("_action");
      if (action === "renameProject") {
        toast({
          title: "Project successfully renamed.",
          status: "success",
          position: "top",
          isClosable: true,
        });
      } else if (action === "changePassword") {
        toast({
          title: "Password changed.",
          status: "success",
          position: "top",
          isClosable: true,
        });
      }
    }
  }, [transition.state]);

  return (
    <Box h="100%" overflowY={"auto"}>
      <Container maxW={"container.md"} p={8} pb={10}>
        <Header>General</Header>
        <Box
          bg={bg}
          as={ValidatedForm}
          validator={renameValidator}
          replace
          method="patch"
          resetAfterSubmit
          p={8}
        >
          <HStack alignItems={"start"}>
            <FormInput
              isRequired
              label="Project name"
              name="projectName"
              bg={bgBW}
              defaultValue={project.name}
            />
            <Spacer />
            <Box>
              <FormSubmitButton
                mt={8}
                name="_action"
                value="renameProject"
                colorScheme={"blue"}
              >
                Rename
              </FormSubmitButton>
            </Box>
          </HStack>
        </Box>

        <Header mt={12}>Danger Zone</Header>
        <Box bg={bg} p={8} w="full">
          <HStack as={Form} replace method="patch">
            <Flex flexDir={"column"}>
              <Text fontWeight={"medium"}>Transfer Ownership</Text>
              <Text w="full">Transfer this project to another user</Text>
            </Flex>
            <Spacer />
            <Button px={6} variant={"outline"} colorScheme={"red"}>
              Transfer
            </Button>
          </HStack>
          <HStack mt={6} as={Form} replace method="patch">
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
