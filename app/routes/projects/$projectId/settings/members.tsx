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
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { ProjectUser, ProjectUserRole, RequestMethod } from "@prisma/client";
import { ActionArgs, json, LoaderArgs, LoaderFunction } from "@remix-run/node";
import {
  FormMethod,
  useCatch,
  useFetcher,
  useLoaderData,
  useMatches,
} from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect } from "react";
import { FiBook, FiChevronDown, FiPlus, FiTrash } from "react-icons/fi";
import { validationError, ValidatorError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { string, z } from "zod";
import { prisma } from "~/models/prisma.server";
import {
  addMemberToProject,
  changeProjectRole,
  findProjectMembersById,
  getProjectById,
  Project,
} from "~/models/project.server";
import { ProjectUserRoles } from "~/models/type";
import { getUserByEmail, getUserInfoByIds } from "~/models/user.server";
import { requireUserId } from "~/session.server";
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
  let userId = await requireUserId(request);
  let formData = await request.formData();
  let { projectId } = params;
  invariant(projectId);

  let project = await findProjectMembersById(projectId);
  if (!project) {
    return httpResponse.BadRequest;
  }

  if (
    project.members.find((member) => member.id === userId)?.role !== "ADMIN"
  ) {
    return httpResponse.Forbidden;
  }

  let action = formData.get("_action");
  switch (action) {
    case "addMember":
      return addMemberAction(project, formData);
    case "changeRole":
      return changeRoleAction(project, formData);
    default:
      return httpResponse.BadRequest;
  }
};

const addMemberAction = async (
  project: {
    id: string;
    members: ProjectUser[];
    name: string;
  },
  formData: FormData
) => {
  let result = await addMemberValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
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

const changeRoleAction = async (
  project: {
    id: string;
    members: ProjectUser[];
  },
  formData: FormData
) => {
  let result = await withZod(
    z.object({
      id: z.string(),
      role: z.enum(ProjectUserRoles),
      _action: z.string(),
    })
  ).validate(formData);

  if (result.error) {
    return validationError(result.error);
  }

  let data = result.data;

  let numOfAdmins = project.members.filter((member) =>
    member.id === data.id ? data.role === "ADMIN" : member.role === "ADMIN"
  ).length;

  if (numOfAdmins === 0) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: {
          role: `Project should have at least 1 admin`,
        },
      },
      data
    );
  }

  await changeProjectRole(project.id, data.id, data.role);
  return json(result.data);
};

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <>
      <div>
        ERROR: {caught.statusText} {caught.status}
      </div>
      <div>{caught.data.message}</div>
    </>
  );
}

export default function () {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const matches = useMatches();
  const project = matches[1].data.project as Project;
  const role = matches[1].data.role as ProjectUserRole;
  let { members } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const toast = useToast();
  const isAdmin = role === "ADMIN";

  const onRoleChange = (id: string, role: ProjectUserRole) => {
    fetcher.submit(
      {
        id: id,
        role: role,
        _action: "changeRole",
      },
      {
        method: "patch",
        replace: true,
      }
    );
  };

  const isLoading = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.type === "done") {
      let errMsg = fetcher.data?.fieldErrors?.role;
      if (errMsg) {
        toast({
          title: "Could not change role.",
          description: errMsg,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      } else {
        const { id, role, _action } = fetcher.data;
        if (_action === "changeRole") {
          const member = members.find((elem) => elem.id === id);
          toast({
            title: "Action Succeed",
            description: `User ${member?.name} changed to ${role}`,
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
        }
      }
    }
  }, [fetcher.type]);

  return (
    <Box h="100%" overflowY={"auto"} px={12} py={9} fontSize="sm">
      <Flex>
        <Header>{1} Members</Header>
        <Spacer />
        <Button
          disabled={!isAdmin}
          size="sm"
          colorScheme={"blue"}
          onClick={onOpen}
        >
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
                  <Select
                    value={member.role}
                    onChange={(e) =>
                      onRoleChange(member.id, e.target.value as ProjectUserRole)
                    }
                    size="sm"
                    icon={
                      isLoading ? <Spinner size={"sm"} /> : <FiChevronDown />
                    }
                    disabled={!isAdmin || isLoading}
                  >
                    <option value={ProjectUserRole.ADMIN}>Admin</option>
                    <option value={ProjectUserRole.WRITE}>Write</option>
                    <option value={ProjectUserRole.READ}>Read</option>
                  </Select>
                </Td>
                <Td px={0}>
                  <Button
                    disabled={!isAdmin}
                    colorScheme={"red"}
                    size="sm"
                    variant={"ghost"}
                  >
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
