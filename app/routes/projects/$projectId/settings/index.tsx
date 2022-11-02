import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Text,
  Spacer,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  Input,
  Center,
  Divider,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { ActionArgs, redirect } from "@remix-run/node";
import { Form, useMatches, useTransition } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect, useState } from "react";
import { json } from "remix-utils";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
import {
  Project,
  updateProject,
  findProjectMembersById,
  transferProject,
  checkAuthority,
} from "~/models/project.server";
import { FormInput, FormSubmitButton, Header } from "~/ui";
import { getUserById, getUserByName } from "~/models/user.server";
import { requireUserId } from "~/session.server";
import { httpResponse } from "~/utils";
import { ProjectUserRole } from "@prisma/client";

export const action = async ({ params, request }: ActionArgs) => {
  let formData = await request.formData();
  let { projectId } = params;
  let userId = await requireUserId(request);
  invariant(projectId);

  if (!checkAuthority(userId, projectId, ProjectUserRole.ADMIN)) {
    return httpResponse.Forbidden;
  }

  let action = formData.get("_action");
  if (action === "renameProject") {
    let result = await renameValidator.validate(formData);
    if (result.error) {
      return validationError(result.error);
    }
    await updateProject(projectId, { name: result.data.projectName });
  } else if (action === "transferProject") {
    let result = await transferValidator.validate(formData);
    if (result.error) {
      return validationError(result.error);
    }
    const transferUser = await getUserByName(result.data.userName);
    if (!transferUser) {
      return validationError(
        { fieldErrors: { userName: "User does not exist" } },
        result.submittedData,
        { status: 404 }
      );
    }
    let project = await findProjectMembersById(projectId);
    if (!project) {
      return httpResponse.BadRequest;
    }
    if (userId === transferUser.id) {
      return validationError(
        { fieldErrors: { userName: "You can't choose yourself" } },
        result.submittedData,
        { status: 403 }
      );
    }
    let currentUser = await getUserById(userId);
    if (!currentUser) {
      return httpResponse.BadRequest;
    }
    await transferProject(project, transferUser, currentUser);
    return redirect("/projects");
  } else if (action === "deleteProject") {
    await updateProject(projectId, { isDeleted: true });
    return redirect("/projects");
  }
  return json({ success: true });
};

const renameValidator = withZod(
  z.object({
    projectName: z.string().trim().min(1, "Please input project name"),
  })
);

const deleteValidator = withZod(z.object({}));

const transferValidator = withZod(
  z.object({
    userName: z.string().trim().min(1, "Please input user name"),
  })
);

const TransferDialog: React.FC<{
  isOpen: boolean;
  onClose: () => any;
  project: Project;
}> = ({ isOpen, onClose, project }) => {
  const [isDisabled, setIsDisabled] = useState(true);
  const bgBW = useColorModeValue("white", "gray.900");
  return (
    <Modal size={"lg"} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Transfer Project</ModalHeader>
        <ModalCloseButton />
        <ModalBody
          pb={6}
          as={ValidatedForm}
          replace
          method="patch"
          resetAfterSubmit
          validator={transferValidator}
        >
          <Alert status="warning">
            <AlertIcon />
            This action{" "}
            <Text display={"inline-block"} fontWeight={"bold"} mx={1}>
              cannot
            </Text>{" "}
            be undone.
          </Alert>

          <Text mt={5}>{"New owner's user name"}</Text>
          <FormInput label=" " name="userName" bg={bgBW} />
          <Text mt={5}>
            Type <Text as="strong">{project.name}</Text> to confirm.
          </Text>
          <Input
            mt={1}
            bg={bgBW}
            onChange={(e) => setIsDisabled(e.target.value !== project.name)}
          />
          <Divider orientation="horizontal" />
          <Center mt={10}>
            <FormSubmitButton
              colorScheme="red"
              isDisabled={isDisabled}
              name="_action"
              value="transferProject"
              ml={3}
            >
              I understand, transfer this project.
            </FormSubmitButton>
          </Center>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const DeleteDialog: React.FC<{
  isOpen: boolean;
  onClose: () => any;
  project: Project;
}> = ({ isOpen, onClose, project }) => {
  const [isDisabled, setIsDisabled] = useState(true);
  const bgBW = useColorModeValue("white", "gray.900");
  return (
    <Modal size={"lg"} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="lg" fontWeight="bold">
          Are you absolutely sure?
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={10}>
          <Alert status="warning">
            <AlertIcon />
            Unexpected bad things will happen if you don't read this!
          </Alert>
          <Box mt={5}>
            This action{" "}
            <Text display={"inline-block"} fontWeight={"bold"} mx={1}>
              cannot
            </Text>{" "}
            be undone. This will permanently delete the
            <Text display={"inline-block"} fontWeight={"bold"} mx={1}>
              {project.name}
            </Text>{" "}
            project and remove all data.
          </Box>
          <Flex mt={5}>
            Please type{" "}
            <Text fontWeight={"bold"} mx={2}>
              {project.name}
            </Text>{" "}
            to confirm.
          </Flex>
          <Input
            mt={2}
            bg={bgBW}
            onChange={(e) => setIsDisabled(e.target.value !== project.name)}
          />
          <Center
            mt={10}
            as={ValidatedForm}
            replace
            method="patch"
            resetAfterSubmit
            validator={deleteValidator}
          >
            <FormSubmitButton
              colorScheme="red"
              isDisabled={isDisabled}
              name="_action"
              value="deleteProject"
              ml={3}
            >
              I understand the consequences, delete this project
            </FormSubmitButton>
          </Center>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default function () {
  const matches = useMatches();
  const project = matches[1].data.project as Project;
  invariant(project);
  const bg = useColorModeValue("gray.100", "gray.700");
  const bgBW = useColorModeValue("white", "gray.900");
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [transferVisible, setTransferVisible] = useState(false);
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
      } else if (action === "deleteProject") {
        transition.type === "actionRedirect" &&
          toast({
            title: "Project successfully deleted",
            status: "success",
            position: "top",
            isClosable: true,
          });
      } else if (action === "transferProject") {
        transition.type === "actionRedirect" &&
          toast({
            title: "Project successfully transferred",
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
            <Button
              px={6}
              variant={"outline"}
              colorScheme={"red"}
              onClick={() => setTransferVisible(true)}
            >
              Transfer
              <TransferDialog
                isOpen={transferVisible}
                onClose={() => setTransferVisible(false)}
                project={project}
              />
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
            <Button
              px={6}
              variant={"outline"}
              colorScheme={"red"}
              onClick={() => setDeleteVisible(true)}
            >
              Delete
              <DeleteDialog
                isOpen={deleteVisible}
                onClose={() => setDeleteVisible(false)}
                project={project}
              />
            </Button>
          </HStack>
        </Box>
      </Container>
    </Box>
  );
}
