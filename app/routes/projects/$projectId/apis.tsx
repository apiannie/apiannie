import {
  Box,
  Center,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  ListItem,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Spacer,
  Text,
  Tooltip,
  UnorderedList,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { ProjectUserRole, RequestMethod, RequestParam } from "@prisma/client";
import { ActionArgs, redirect } from "@remix-run/node";
import {
  Link as RemixLink,
  useCatch,
  useFetcher,
  useMatches,
} from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect, useState } from "react";
import {
  BsFillCaretDownFill,
  BsFillCaretRightFill,
  BsFolder2Open,
} from "react-icons/bs";
import { FiAirplay, FiFilePlus, FiFolder, FiFolderPlus } from "react-icons/fi";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
import {
  createApi,
  createGroup,
  updateApi,
  updateGroup,
} from "~/models/api.server";
import { Api, checkAuthority, Group, Project } from "~/models/project.server";
import { RequestMethods } from "~/models/type";
import { requireUser, requireUserId } from "~/session.server";
import { PathInput } from "~/ui";
import FormCancelButton from "~/ui/Form/FormCancelButton";
import FormHInput from "~/ui/Form/FormHInput";
import FormInput from "~/ui/Form/FormInput";
import FormModal from "~/ui/Form/FormModal";
import FormSubmitButton from "~/ui/Form/FormSubmitButton";
import { httpResponse, parsePath } from "~/utils";
import { ProjecChangeButton } from "../$projectId";

export const handle = {
  sideNav: <SideNav />,
};

enum Action {
  NEW_GROUP = "NEW_GROUP",
  NEW_API = "NEW_API",
  UPDATE_API = "UPDATE_API",
  UPDATE_GROUP = "UPDATE_GROUP",
}

export const action = async ({ request, params }: ActionArgs) => {
  let userId = await requireUserId(request);
  let formData = await request.formData();
  let { projectId } = params;
  invariant(projectId);

  if (!(await checkAuthority(userId, projectId, ProjectUserRole.WRITE))) {
    return httpResponse.Forbidden;
  }

  switch (formData.get("_action")) {
    case Action.NEW_GROUP:
      return await newGroupAction(formData, projectId);
    case Action.UPDATE_GROUP:
      return await updateGroupAction(formData);
    case Action.NEW_API:
      return await newApiAction(formData, projectId);
    case Action.UPDATE_API:
      return await updateApiAction(formData);
    default:
      console.info("_action:", formData.get("_action"));
      return httpResponse.NotFound;
  }
};

const updateApiAction = async (formData: FormData) => {
  const result = await withZod(
    z.object({
      id: z.string().min(1, "id is required"),
      groupId: z.string(),
      data: z.any(),
    })
  ).validate(formData);
  if (result.error) {
    return validationError(result.error);
  }
  return await updateApi(result.data.id, {
    groupId: result.data.groupId,
    data: result.data.data,
  });
};

const newGroupAction = async (formData: FormData, projectId: string) => {
  const result = await newGroupValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }

  const { parentId, name } = result.data;
  let group = await createGroup({
    parentId: parentId,
    projectId: projectId,
    name,
  });

  return redirect(`/projects/${group.projectId}/apis/groups/${group.id}`);
};

const updateGroupAction = async (formData: FormData) => {
  const result = await withZod(
    z.object({
      id: z.string().min(1, "id is required"),
      parentId: z.string(),
      name: z.string(),
      description: z.string(),
    })
  ).validate(formData);
  if (result.error) {
    return validationError(result.error);
  }
  const { id, name, description, parentId } = result.data;
  return await updateGroup({ id, name, description, parentId });
};

const newApiAction = async (formData: FormData, projectId: string) => {
  const result = await newApiValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }

  const { name, path, method, groupId } = result.data;

  let { params } = parsePath(path);

  let api = await createApi(projectId, groupId, {
    name,
    path,
    method,
    pathParams: params.map<RequestParam>((param) => ({
      name: param,
      example: "",
      description: "",
      isRequired: true,
      type: "STRING",
    })),
  });

  return redirect(`/projects/${projectId}/apis/details/${api.id}`);
};

function SideNav() {
  const groupModal = useDisclosure();
  const apiModal = useDisclosure();

  return (
    <Grid templateRows="50px 40px minmax(0, 1fr)" h="100vh" overflowX={"auto"}>
      <ProjecChangeButton />
      <GridItem>
        <HStack px={2}>
          <Heading ml="2" fontWeight={"500"} size={"sm"} color="gray.400">
            APIs
          </Heading>
          <Spacer />
          <Box>
            {/* <Tooltip label="Clone">
              <IconButton
                aria-label="clone"
                icon={<FiCopy />}
                variant="ghost"
                colorScheme="gray"
              />
            </Tooltip> */}
            <Tooltip label="New group">
              <IconButton
                aria-label="add group"
                icon={<FiFolderPlus />}
                variant="ghost"
                colorScheme="gray"
                onClick={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.blur();
                  }
                  groupModal.onOpen();
                }}
              />
            </Tooltip>
            <NewGroupModal
              isOpen={groupModal.isOpen}
              onClose={groupModal.onClose}
            />
            <Tooltip label="New Api">
              <IconButton
                aria-label="add api"
                icon={<FiFilePlus />}
                variant="ghost"
                colorScheme="gray"
                onClick={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.blur();
                  }
                  apiModal.onOpen();
                }}
              />
            </Tooltip>
            <NewApiModal isOpen={apiModal.isOpen} onClose={apiModal.onClose} />
          </Box>
        </HStack>
        <Divider />
      </GridItem>
      <GridItem overflowY={"auto"}>
        <SideNavContent />
      </GridItem>
    </Grid>
  );
}

const newGroupValidator = withZod(
  z.object({
    name: z.string().min(1, "group name is required"),
    parentId: z.string().optional(),
  })
);

const NewGroupModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: (data?: any) => void;
}) => {
  const params = useParams();
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      validator={newGroupValidator}
      replace
      method="post"
      size="lg"
      action={`/projects/${params.projectId}/apis`}
    >
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>New Group</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormInput
            name="name"
            label="Name"
            placeholder="Group name"
            autoComplete="off"
          />
          <input
            name="parentId"
            value={params.groupId || undefined}
            type="hidden"
          />
        </ModalBody>

        <ModalFooter>
          <FormCancelButton onClick={onClose} mr={3}>
            Cancel
          </FormCancelButton>
          <FormSubmitButton
            type="submit"
            name="_action"
            value={Action.NEW_GROUP}
            colorScheme="blue"
          >
            Create
          </FormSubmitButton>
        </ModalFooter>
      </ModalContent>
    </FormModal>
  );
};

const newApiValidator = withZod(
  z.object({
    name: z.string().trim().min(1, "api name is required"),
    path: z.string().trim().min(1, "path is required"),
    method: z.enum(RequestMethods),
    groupId: z.string().trim().optional(),
  })
);

export const NewApiModal = ({
  isOpen,
  onClose,
}: {
  isOpen: ModalProps["isOpen"];
  onClose: ModalProps["onClose"];
}) => {
  const matches = useMatches();
  const params = useParams();
  const gray = useColorModeValue("gray.200", "gray.700");
  let groupId = "";
  if (params.groupId) {
    groupId = params.groupId;
  } else if (params.apiId) {
    groupId = matches?.[3].data?.api?.groupId;
  }

  let labelWidth = "60px";
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      validator={newApiValidator}
      replace
      method="post"
      size="xl"
      action={`/projects/${params.projectId}/apis`}
    >
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>New Api</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={5}>
            <FormHInput
              labelWidth={labelWidth}
              name="name"
              label="Name"
              size="sm"
              as={Input}
              autoComplete="off"
            />
            <FormHInput
              labelWidth={labelWidth}
              name="path"
              label="Path"
              as={PathInput}
              autoComplete="off"
              size="sm"
            />
            <Flex width={"full"} pl={labelWidth} flexDir={"row"}>
              <UnorderedList fontSize={"sm"}>
                <ListItem>
                  The API path starts with{" "}
                  <Text borderRadius={4} px={1} as="span" bg={gray}>
                    /
                  </Text>
                </ListItem>
                <ListItem>
                  Use curly braces to indicate Path Params, such as
                  <Text borderRadius={4} px={1} as="span" bg={gray}>
                    {"/users/{id}"}
                  </Text>
                </ListItem>
              </UnorderedList>
            </Flex>
          </VStack>

          <input type={"hidden"} name="groupId" value={groupId} />
        </ModalBody>

        <ModalFooter>
          <FormCancelButton onClick={onClose} mr={3}>
            Cancel
          </FormCancelButton>
          <FormSubmitButton
            type="submit"
            name="_action"
            value={Action.NEW_API}
            colorScheme="blue"
          >
            Create
          </FormSubmitButton>
        </ModalFooter>
      </ModalContent>
    </FormModal>
  );
};

const SideNavContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const color = useColorModeValue("teal.800", "teal.100");
  const bg = useColorModeValue("blue.100", "blue.800");
  return (
    <Box>
      <FileNavbar />
    </Box>
  );
};

const groupDFS = (group: Group, id: string, path: string[]) => {
  if (group.id === id) {
    path.push(group.id);
    return true;
  }
  path.push(group.id);
  for (let child of group.groups) {
    if (groupDFS(child, id, path)) {
      return true;
    }
  }
  path.pop();
  return false;
};

const useAccordion = (initialValue?: string[] | null | undefined) => {
  let initial: { [key: string]: boolean } = {};
  if (initialValue instanceof Array) {
    for (let value of initialValue) {
      initial[value] = true;
    }
  }
  const [accordionMap, setAccordionMap] = useState(initial);

  const onAdd = (value: string | string[]) => {
    let newValues: { [key: string]: boolean } = {};
    if (!(value instanceof Array)) {
      value = [value];
    }
    for (let v of value) {
      newValues[v] = true;
    }
    setAccordionMap({
      ...accordionMap,
      ...newValues,
    });
  };

  const onDelete = (value: string) => {
    let clone = Object.assign({}, accordionMap);
    delete clone[value];
    setAccordionMap(clone);
  };

  return {
    accordionMap,
    onAdd,
    onDelete,
  };
};

const FileNavbar = () => {
  const matches = useMatches();
  const params = useParams();
  const project = matches[1].data.project as Project;
  const fetcher = useFetcher();
  invariant(project);
  const { accordionMap, onAdd, onDelete } = useAccordion(["root"]);
  return (
    <Flex flexDir={"column"}>
      <Folder
        accordionMap={accordionMap}
        onAdd={onAdd}
        onDelete={onDelete}
        group={project.root}
        depth={-1}
      />
    </Flex>
  );
};

const FolderIcon = ({ isExpanded }: { isExpanded: boolean }) => {
  const iconColor = useColorModeValue("blackAlpha.600", "whiteAlpha.800");
  return (
    <Center
      mr={1}
      w="4"
      h="4"
      borderRadius={"full"}
      _groupHover={{ background: "blackAlpha.50" }}
    >
      <Icon
        as={isExpanded ? BsFillCaretDownFill : BsFillCaretRightFill}
        fontSize="12px"
        color={iconColor}
      />
    </Center>
  );
};

const Folder = ({
  group,
  onDelete,
  onAdd,
  depth,
  accordionMap,
}: {
  group: Group;
  onDelete: (value: string) => void;
  onAdd: (value: string) => void;
  accordionMap: { [key: string]: boolean };

  depth: number;
}) => {
  const { projectId, groupId } = useParams<{
    projectId: string;
    groupId: string;
  }>();
  const isActive = groupId === group.id;
  const bg = useColorModeValue("blue.200", "blue.600");
  const iconColor = useColorModeValue("blackAlpha.600", "whiteAlpha.800");
  const hoverColor = useColorModeValue("blue.100", "blue.800");
  const isOpen = accordionMap[group.id];
  return (
    <Flex border={"none"} flexDir="column">
      {depth === -1 ? (
        <NavLink to={`/projects/${projectId}/apis`} end>
          {({ isActive }) => (
            <HStack
              h={8}
              pl={2}
              borderRadius={2}
              bg={isActive ? bg : undefined}
              _hover={{ background: isActive ? undefined : hoverColor }}
            >
              <Icon as={FiAirplay} mt={0.5} />
              <Text userSelect={"none"}>Overview</Text>
            </HStack>
          )}
        </NavLink>
      ) : (
        <HStack
          spacing={0}
          w="full"
          pl={`${8 + depth * 16}px`}
          _hover={{ background: isActive ? undefined : hoverColor }}
          cursor="pointer"
          role="group"
          h={8}
          bg={isActive ? bg : undefined}
          onClick={(_e) =>
            isActive
              ? isOpen
                ? onDelete(group.id)
                : onAdd(group.id)
              : isOpen
              ? undefined
              : onAdd(group.id)
          }
        >
          <FolderIcon isExpanded={isOpen} />
          <Box
            as={RemixLink}
            flexGrow={1}
            display="flex"
            alignItems={"center"}
            to={`/projects/${projectId}/apis/groups/${group.id}`}
          >
            <Icon
              as={isOpen ? BsFolder2Open : FiFolder}
              fontWeight="100"
              color={iconColor}
              mr={2}
            />
            <Text py={1} userSelect={"none"}>
              {group.name}
            </Text>
          </Box>
        </HStack>
      )}
      <Flex
        display={isOpen ? "flex" : "none"}
        flexDir={"column"}
        w="full"
        p={0}
      >
        {group.groups.map((g) => (
          <Folder
            key={g.id}
            accordionMap={accordionMap}
            onAdd={onAdd}
            onDelete={onDelete}
            group={g}
            depth={depth + 1}
          />
        ))}
        {group.apis.map((api, i) => (
          <File api={api} depth={depth + 1} key={api.id} />
        ))}
      </Flex>
    </Flex>
  );
};

export const useMethodTag = (method: string) => {
  let colorMode = useColorMode();
  let color = "";
  let [value, setValue] = useState(generator(method));

  useEffect(() => {
    setValue(generator(method));
  }, [method, colorMode.colorMode]);

  function generator(method: string) {
    let text: string = method;

    switch (method) {
      case RequestMethod.GET:
        color = "green";
        break;
      case RequestMethod.POST:
        color = "orange";
        break;
      case RequestMethod.PUT:
        color = "blue";
        break;
      case RequestMethod.PATCH:
        color = "teal";
        text = "PAT";
        break;
      case RequestMethod.DELETE:
        color = "red";
        text = "DEL";
        break;
      case RequestMethod.HEAD:
        color = "purple";
        break;
      case RequestMethod.OPTIONS:
        color = "cyan";
    }

    color += colorMode.colorMode === "light" ? ".600" : ".300";

    return { text, color };
  }

  return value;
};

const MethodTag = ({ method }: { method: RequestMethod }) => {
  let { text, color } = useMethodTag(method);

  return (
    <Text
      fontWeight={700}
      fontSize="xs"
      mt={0.25}
      color={color}
      flexBasis="40px"
      flexShrink={0}
      flexGrow={0}
    >
      {text}
    </Text>
  );
};

export function CatchBoundary() {
  const caught = useCatch();
  return (
    <Center pt={10}>
      {caught.status}-{caught.statusText}
    </Center>
  );
}

const File = ({ api, depth, ...rest }: { api: Api; depth: number }) => {
  const { projectId, apiId } = useParams();
  const bg = useColorModeValue("blue.200", "blue.600");
  const isActive = api.id === apiId;
  invariant(projectId);
  const hoverColor = useColorModeValue("blue.100", "blue.800");
  return (
    <Flex
      as={RemixLink}
      to={`/projects/${projectId}/apis/details/${api.id}`}
      pl={`${12 + depth * 16}px`}
      h="8"
      _hover={{ background: isActive ? undefined : hoverColor }}
      bg={isActive ? bg : undefined}
      cursor="pointer"
      {...rest}
    >
      <HStack w="full" spacing={0}>
        <MethodTag method={api.data.method} />
        <Text noOfLines={1}>{api.data.name}</Text>
      </HStack>
    </Flex>
  );
};

export default function Apis() {
  return <Outlet />;
}
