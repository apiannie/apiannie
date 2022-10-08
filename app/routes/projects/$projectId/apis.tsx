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
  InputGroup,
  InputLeftAddon,
  InputProps,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Select,
  Spacer,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { RequestMethod } from "@prisma/client";
import { ActionArgs, redirect } from "@remix-run/node";
import { Link as RemixLink, useMatches } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect, useState } from "react";
import {
  FiAirplay,
  FiChevronDown,
  FiChevronRight,
  FiCopy,
  FiFilePlus,
  FiFolder,
  FiFolderPlus,
} from "react-icons/fi";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
import { createApi, createGroup } from "~/models/api.server";
import { Api, Group, Project } from "~/models/project.server";
import { requireUser } from "~/session.server";
import FormCancelButton from "~/ui/Form/FormCancelButton";
import FormHInput from "~/ui/Form/FormHInput";
import FormInput from "~/ui/Form/FormInput";
import FormModal from "~/ui/Form/FormModal";
import FormSubmitButton from "~/ui/Form/FormSubmitButton";
import { httpResponse } from "~/utils";

export const handle = {
  sideNav: <SideNav />,
};

enum Action {
  NEW_GROUP = "NEW_GROUP",
  NEW_API = "NEW_API",
}

export const action = async ({ request, params }: ActionArgs) => {
  let formData = await request.formData();
  let { projectId, groupId } = params;
  console.log("action");
  invariant(projectId);

  switch (formData.get("_action")) {
    case Action.NEW_GROUP:
      const user = await requireUser(request);
      return await newGroupAction(formData, projectId);
    case Action.NEW_API:
      return await newApiAction(formData, projectId);
    default:
      console.log("_action:", formData.get("_action"));
      throw httpResponse.NotFound;
  }
};

const newGroupAction = async (formData: FormData, projectId: string) => {
  const result = await newGroupValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }

  console.log(result.submittedData);

  const { parentId, name } = result.data;
  let group = await createGroup({
    parentId: parentId,
    projectId: projectId,
    name,
  });

  return redirect(`/projects/${group.projectId}/apis/groups/${group.id}`);
};

const newApiAction = async (formData: FormData, projectId: string) => {
  const result = await newApiValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }

  const { name, path, method, groupId } = result.data;
  let api = await createApi(projectId, groupId, {
    name,
    path,
    method,
  });

  return redirect(`/projects/${projectId}/apis/details/${api.id}`);
};

function SideNav() {
  const groupModal = useDisclosure();
  const apiModal = useDisclosure();

  return (
    <Grid templateRows={"40px minmax(0, 1fr)"}>
      <GridItem>
        <HStack px={2}>
          <Heading ml="2" fontWeight={"500"} size={"sm"} color="gray.400">
            APIs
          </Heading>
          <Spacer />
          <Box>
            <Tooltip label="Clone">
              <IconButton
                aria-label="clone"
                icon={<FiCopy />}
                variant="ghost"
                colorScheme="gray"
              />
            </Tooltip>
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
        <ModalHeader>Create group</ModalHeader>
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

const RequestMethods = [
  RequestMethod.GET,
  RequestMethod.POST,
  RequestMethod.PUT,
  RequestMethod.PATCH,
  RequestMethod.DELETE,
  RequestMethod.OPTION,
  RequestMethod.HEAD,
] as const;

const newApiValidator = withZod(
  z.object({
    name: z.string().trim().min(1, "api name is required"),
    path: z.string().trim().min(1, "path is required"),
    method: z.enum(RequestMethods),
    groupId: z.string().trim().optional(),
  })
);

const NewApiModal = ({
  isOpen,
  onClose,
}: {
  isOpen: ModalProps["isOpen"];
  onClose: ModalProps["onClose"];
}) => {
  const params = useParams();
  let groupId = "";
  if (params.groupId) {
    groupId = params.groupId;
  }
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
        <ModalHeader>Create Api</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={5}>
            <FormHInput
              labelWidth="60px"
              name="name"
              label="Name"
              size="sm"
              input={Input}
              autoComplete="off"
            />
            <FormHInput
              labelWidth="60px"
              name="path"
              label="Path"
              input={PathInput}
              autoComplete="off"
            />
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

const PathInput = (props: InputProps) => {
  return (
    <InputGroup size={"sm"}>
      <InputLeftAddon
        children={
          <Select name="method" variant="unstyled">
            {RequestMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        }
      />
      <Input {...props} />
    </InputGroup>
  );
};

const SideNavContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const color = useColorModeValue("teal.800", "teal.100");
  const bg = useColorModeValue("blue.100", "blue.800");
  return (
    <Box>
      <NavLink to={`/projects/${projectId}/apis`} end>
        {({ isActive }) => (
          <HStack
            h={8}
            pl={2}
            color={color}
            bg={isActive ? bg : undefined}
            _hover={{ background: isActive ? undefined : "blackAlpha.50" }}
          >
            <Icon as={FiAirplay} mt={0.5} />
            <Text userSelect={"none"}>Overview</Text>
          </HStack>
        )}
      </NavLink>
      <FileNavbar />
    </Box>
  );
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

const FileNavbar = () => {
  const matches = useMatches();
  const project: Project = matches[1].data.project;
  let { groupId, apiId } = useParams();
  const { accordionMap, onAdd, onDelete } = useAccordion();

  invariant(project);

  useEffect(() => {
    let path: string[] = [];
    if (!groupId && !apiId) {
      return;
    }
    let groupMap = new Map<string, Group>();
    let apiMap = new Map<string, Api>();
    let stack = new Array<Group>(project.root);

    while (stack.length > 0) {
      let group = stack.pop();
      invariant(group);
      for (let g of group.groups) {
        groupMap.set(g.id, g);
        stack.push(g);
      }
      for (let api of group.apis) {
        apiMap.set(api.id, api);
      }
    }

    if (apiId) {
      groupId = apiMap.get(apiId)?.groupId || undefined;
    }

    if (!groupId) {
      return;
    }

    while (groupId) {
      path.push(groupId);
      groupId = groupMap.get(groupId)?.parentId || undefined;
    }

    onAdd(path);
  }, [groupId]);

  invariant(project);
  return (
    <Flex flexDir={"column"}>
      {project.root.groups.map((group) => (
        <Folder
          accordionMap={accordionMap}
          onAdd={onAdd}
          onDelete={onDelete}
          key={group.id}
          group={group}
          depth={0}
        />
      ))}
      {project.root.apis.map((api) => (
        <File key={api.id} api={api} depth={0} />
      ))}
    </Flex>
  );
};

const FolderIcon = ({
  isExpanded,
  onClick,
}: {
  isExpanded: boolean;
  onClick: (e: any) => void;
}) => {
  return (
    <Center
      mr={1}
      w="4"
      h="4"
      borderRadius={"full"}
      _groupHover={{ background: "blackAlpha.50" }}
      onClick={onClick}
    >
      <Icon as={isExpanded ? FiChevronDown : FiChevronRight} fontSize="12px" />
    </Center>
  );
};

const Folder = ({
  depth,
  group,
  accordionMap,
  onAdd,
  onDelete,
}: {
  group: Group;
  depth: number;
  accordionMap: { [key: string]: boolean };
  onAdd: (value: string) => void;
  onDelete: (value: string) => void;
}) => {
  const { projectId, groupId } = useParams<{
    projectId: string;
    groupId: string;
  }>();
  const isActive = groupId === group.id;
  const bg = useColorModeValue("blue.100", "blue.800");
  const isOpen = accordionMap[group.id];
  return (
    <Flex border={"none"} flexDir="column">
      <HStack
        spacing={0}
        w="full"
        pl={`${8 + depth * 16}px`}
        _hover={{ background: isActive ? undefined : "blackAlpha.50" }}
        cursor="pointer"
        role="group"
        h={8}
        bg={isActive ? bg : undefined}
        onClick={(_e) =>
          isActive ? (isOpen ? onDelete(group.id) : onAdd(group.id)) : undefined
        }
      >
        <FolderIcon
          isExpanded={isOpen}
          onClick={(e) =>
            !isActive
              ? isOpen
                ? onDelete(group.id)
                : onAdd(group.id)
              : undefined
          }
        />
        <Box
          as={RemixLink}
          flexGrow={1}
          display="flex"
          alignItems={"center"}
          to={`/projects/${projectId}/apis/groups/${group.id}`}
        >
          <Icon as={FiFolder} fontWeight="100" color="blackAlpha.400" mr={2} />
          <Text py={1} userSelect={"none"}>
            {group.name}
          </Text>
        </Box>
      </HStack>
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
        {group.apis.map((api) => (
          <File key={api.id} api={api} depth={depth + 1} />
        ))}
      </Flex>
    </Flex>
  );
};

const MethodTag = ({ method }: { method: RequestMethod }) => {
  let color = "";
  let text: string = method;

  switch (method) {
    case RequestMethod.GET:
      color = "green.400";
      break;
    case RequestMethod.POST:
      color = "orange.400";
      break;
    case RequestMethod.PUT:
      color = "blue.400";
      break;
    case RequestMethod.PATCH:
      color = "teal.400";
      text = "PAT";
      break;
    case RequestMethod.DELETE:
      color = "red.400";
      text = "DEL";
      break;
    case RequestMethod.HEAD:
      color = "purple.400";
      break;
    case RequestMethod.OPTION:
      color = "cyan.400";
  }

  return (
    <Text
      fontWeight={700}
      fontSize="sm"
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

const File = ({ api, depth }: { api: Api; depth: number }) => {
  const { projectId, apiId } = useParams();
  const bg = useColorModeValue("blue.100", "blue.800");
  const isActive = api.id === apiId;
  invariant(projectId);
  return (
    <Flex
      as={RemixLink}
      to={`/projects/${projectId}/apis/details/${api.id}`}
      pl={`${12 + depth * 16}px`}
      h="8"
      _hover={{ background: isActive ? undefined : "blackAlpha.50" }}
      bg={isActive ? bg : undefined}
      cursor="pointer"
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
