import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  Spacer,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  useDisclosure,
  Select,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Center,
  RadioGroup,
  VStack,
  Radio,
} from "@chakra-ui/react";
import { ProjectUserRole } from "@prisma/client";
import { ActionArgs, json, LoaderArgs, LoaderFunction } from "@remix-run/node";
import { useLoaderData, useMatches } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { FiBook, FiPlus, FiTrash } from "react-icons/fi";
import { validationError, ValidatorError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
import { prisma } from "~/models/prisma.server";
import {
  addMemberToProject,
  getProjectById,
  Project,
} from "~/models/project.server";
import { ProjectUserRoles } from "~/models/type";
import { getUserByEmail, getUserInfoByIds } from "~/models/user.server";
import { FormInput, FormModal, FormSubmitButton, Header } from "~/ui";
import { httpResponse } from "~/utils";

export const loader = async ({ params }: LoaderArgs) => {
  let { projectId } = params;
  invariant(projectId);
  let project = await getProjectById(projectId);
  if (!project) {
    throw httpResponse.BadRequest;
  }
  let members = await getUserInfoByIds(project.members.map((item) => item.id));
  let roleMap = project.members.reduce((prev, curr) => {
    prev[curr.id] = curr.role;
    return prev;
  }, {} as { [key: string]: ProjectUserRole });
  let retval = members.map(
    (member) =>
      ({
        ...member,
        role: roleMap[member.id],
      } as typeof member & { role: ProjectUserRole })
  );
  return json({ members: retval });
};

export const action = async ({ request, params }: ActionArgs) => {
  let formData = await request.formData();
  let { projectId } = params;
  invariant(projectId);
  let action = formData.get("_action");
  switch (action) {
    case "addMember":
      return addMemberAction(projectId, formData);
    default:
      return httpResponse.BadRequest;
  }
};

const addMemberAction = async (projectId: string, formData: FormData) => {
  let result = await addMemberValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }
  let project = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      members: true,
    },
  });
  if (!project) {
    return httpResponse.BadRequest;
  }

  let user = await getUserByEmail(result.data.email);
  if (!user) {
    return validationError({
      formId: result.formId,
      fieldErrors: {
        email: `${result.data.email} is not a registered user.`,
      },
    });
  }

  for (let member of project.members) {
    if (member.id === user.id) {
      return validationError({
        formId: result.formId,
        fieldErrors: {
          email: `${result.data.email} is already a member of ${project.name}.`,
        },
      });
    }
  }

  await addMemberToProject(project.id, user.id, result.data.role);

  return httpResponse.OK;
};

export default function () {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const matches = useMatches();
  const project = matches[1].data.project as Project;
  let { members } = useLoaderData<typeof loader>();
  return (
    <Box h="100%" overflowY={"auto"} px={12} py={9} fontSize="sm">
      <Flex>
        <Header>{1} Members</Header>
        <Spacer />
        <Button size="sm" colorScheme={"blue"} onClick={onOpen}>
          <Icon as={FiPlus} mr={1} /> Member
        </Button>
        <AddMemberModal isOpen={isOpen} onClose={onClose} project={project} />
      </Flex>
      <Divider />
      <TableContainer mt={"10px"}>
        <Table size={"sm"}>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th w={40} isNumeric>
                Role
              </Th>
              <Th px={0} w={10}></Th>
            </Tr>
          </Thead>
          <Tbody>
            {members.map((member) => (
              <Tr key={member.id}>
                <Td>{member.name}</Td>
                <Td>
                  <Text>{member.email}</Text>
                </Td>
                <Td isNumeric>
                  <Select size="sm">
                    <option>Admin</option>
                    <option>Write</option>
                    <option>Read</option>
                  </Select>
                </Td>
                <Td px={0}>
                  <Button colorScheme={"red"} size="sm" variant={"ghost"}>
                    <Icon as={FiTrash} />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

const addMemberValidator = withZod(
  z.object({
    email: z
      .string()
      .trim()
      .min(1, "Please input the email address of the member to invite.")
      .email("Invalid email format"),
    role: z.enum(ProjectUserRoles),
  })
);

const AddMemberModal = ({
  isOpen,
  onClose,
  project,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      validator={addMemberValidator}
      replace
      method="post"
      size="2xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <Center pt={20} pb={12} flexDir={"column"}>
          <Icon as={FiBook} display="block" w={12} h={12} color="gray.500" />
          <Text fontSize="lg" mt={4}>
            Add people to{" "}
            <Text as="b" fontWeight={"bold"}>
              {project.name}
            </Text>
          </Text>
        </Center>
        <ModalBody px={0} pb={6}>
          <Box px={8}>
            <FormInput name="email" placeholder="Email" />
          </Box>
          <Text fontSize={"sm"} px={8} mt={8} color="gray.500">
            Choose a role
          </Text>
          <Divider />
          <RadioGroup size={"sm"} defaultValue={ProjectUserRole.READ}>
            <VStack alignItems={"baseline"}>
              <Radio px={8} py={2} name="role" value={ProjectUserRole.READ}>
                <Flex flexDir={"column"}>
                  <Text fontWeight={"bold"}>Read</Text>
                  <Text>
                    Recommended for non-code contributors who want to view or
                    discuss your project.
                  </Text>
                </Flex>
              </Radio>
              <Divider style={{ marginTop: 0 }} />
              <Radio px={8} py={2} name="role" value={ProjectUserRole.WRITE}>
                <Flex flexDir={"column"}>
                  <Text fontWeight={"bold"}>Write</Text>
                  <Text>
                    Recommended for contributors who actively edit to your
                    project.
                  </Text>
                </Flex>
              </Radio>
              <Divider style={{ marginTop: 0 }} />
              <Radio px={8} py={2} name="role" value={ProjectUserRole.ADMIN}>
                <Flex flexDir={"column"}>
                  <Text fontWeight={"bold"}>Admin</Text>
                  <Text>
                    Recommended for people who need full access to the project,
                    including sensitive and destructive actions like managing
                    members or deleting a project.
                  </Text>
                </Flex>
              </Radio>
              <Divider style={{ marginTop: 0 }} />
            </VStack>
          </RadioGroup>
        </ModalBody>
        <ModalFooter mb={6} justifyContent={"center"}>
          <FormSubmitButton
            px={12}
            type="submit"
            colorScheme="blue"
            name="_action"
            value="addMember"
          >
            Add
          </FormSubmitButton>
        </ModalFooter>
      </ModalContent>
    </FormModal>
  );
};
