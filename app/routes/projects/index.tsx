import {
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightAddon,
  Link,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Spacer,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useLoaderData, useTransition } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useRef } from "react";
import { FiFile, FiPlus, FiSearch, FiUsers } from "react-icons/fi";
import { validationError } from "remix-validated-form";
import { z } from "zod";
import logo from "~/images/logo.png";
import { createProject, getProjectByIds } from "~/models/project.server";
import { requireUser } from "~/session.server";
import { FormCancelButton, FormInput, FormModal, FormSubmitButton } from "~/ui";
import ColorModeButton from "../home/..lib/ColorModeButton";
import NotificationButton from "../home/..lib/NotificationButton";
import UserMenuButton from "../home/..lib/UserMenuButton";

export const loader = async ({ request }: LoaderArgs) => {
  let user = await requireUser(request);
  let projects = await getProjectByIds(user.projectIds);

  return json({ user, projects });
};

export const validator = withZod(
  z.object({
    name: z.string().min(1, "project name is required"),
  })
);

export const action = async ({ request }: ActionArgs) => {
  let formData = await request.formData();
  const result = await validator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }
  let user = await requireUser(request);
  const { name } = result.data;

  let project = await createProject(user, name);
  return json({ project });
};

export default function () {
  const { user, projects } = useLoaderData<typeof loader>();
  const { isOpen, onClose, onOpen } = useDisclosure();

  const transition = useTransition();

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.600", "gray.700")}>
      <Container py={"4rem"}>
        <HStack py={5} spacing={4}>
          <Image src={logo} h={10} />
          <Spacer />
          <ColorModeButton />
          <NotificationButton />
          <UserMenuButton
            w={10}
            h={10}
            avatar={user.avatar || undefined}
            name={user.name}
          />
        </HStack>
        <NewProjectModal isOpen={isOpen} onClose={onClose} />
        <Box borderRadius={"xl"} bg={useColorModeValue("white", "gray.800")}>
          {projects.length === 0 ? (
            <Landing name={user.name} onOpen={onOpen} />
          ) : (
            <Projects projects={projects} onOpen={onOpen} />
          )}
        </Box>
      </Container>
    </Box>
  );
}

const Projects = ({
  projects,
  onOpen,
}: {
  projects: Awaited<ReturnType<typeof getProjectByIds>>;
  onOpen: () => void;
}) => {
  return (
    <>
      <Box py={5} px={8}>
        <InputGroup size="md">
          <InputLeftElement
            pointerEvents="none"
            children={<Icon as={FiSearch} color="gray.300" />}
          />
          <Input placeholder="Search project" />
          <InputRightAddon
            as={Button}
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="blue"
            bg={useColorModeValue("blue.500", "blue.200")}
            onClick={onOpen}
            borderWidth={0}
          >
            Add
          </InputRightAddon>
        </InputGroup>
      </Box>
      <Divider borderColor={useColorModeValue("gray.300", "gray.600")} />
      <VStack
        alignItems={"start"}
        spacing={0}
        divider={
          <Divider borderColor={useColorModeValue("gray.300", "gray.600")} />
        }
      >
        {projects.map((project) => (
          <ProjectItem
            key={project.id}
            id={project.id}
            name={project.name}
            memberCount={project.members.length}
            apiCount={project.apis.length}
          />
        ))}
      </VStack>
    </>
  );
};

const ProjectItem = ({
  id,
  name,
  memberCount,
  apiCount,
}: {
  name: string;
  id: string;
  memberCount: number;
  apiCount: number;
}) => {
  return (
    <Box px={8} py={5}>
      <Link isExternal href={`/projects/${id}/apis`}>
        <Text
          fontWeight={"600"}
          color={useColorModeValue("blue.700", "blue.200")}
          fontSize={"lg"}
          mb={2}
        >
          {name}
        </Text>
      </Link>
      <HStack spacing={8}>
        <HStack>
          <Box w={3} h={3} bg="blue.500" borderRadius={"full"} />
          <Text>REST</Text>
        </HStack>
        <HStack>
          <Icon as={FiUsers} />
          <Text>{memberCount}</Text>
        </HStack>
        <HStack>
          <Icon as={FiFile} />
          <Text>{apiCount}</Text>
        </HStack>
      </HStack>
    </Box>
  );
};

const Landing = ({ name, onOpen }: { name: string; onOpen: () => void }) => {
  return (
    <VStack p={8}>
      <Heading textAlign={"center"} size="lg">
        Welcome {name}
      </Heading>
      <Text textAlign={"center"} size="md">
        Create your first project to continue
      </Text>
      <Box pt={12}>
        <Button
          onClick={onOpen}
          size="lg"
          colorScheme="blue"
          leftIcon={<Icon as={FiPlus} />}
        >
          Create project
        </Button>
      </Box>
    </VStack>
  );
};

const NewProjectModal = ({
  isOpen,
  onClose,
}: {
  isOpen: ModalProps["isOpen"];
  onClose: ModalProps["onClose"];
}) => {
  const initialRef = useRef(null);
  const finalRef = useRef(null);

  return (
    <FormModal
      initialFocusRef={initialRef}
      finalFocusRef={finalRef}
      isOpen={isOpen}
      onClose={onClose}
      validator={validator}
      replace
      method="post"
      size="lg"
    >
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>Create project</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormInput name="name" label="Name" placeholder="Project name" />
        </ModalBody>

        <ModalFooter>
          <FormCancelButton onClick={onClose} mr={3}>
            Cancel
          </FormCancelButton>
          <FormSubmitButton type="submit" colorScheme="blue">
            Create
          </FormSubmitButton>
        </ModalFooter>
      </ModalContent>
    </FormModal>
  );
};
