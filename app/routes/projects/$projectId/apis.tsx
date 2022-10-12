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
import { useEffect, useMemo, useState } from "react";
import {
  FiAirplay,
  FiCopy,
  FiFilePlus,
  FiFolder,
  FiFolderPlus,
} from "react-icons/fi";
import {
  BsFolder2Open,
  BsFillCaretRightFill,
  BsFillCaretDownFill,
} from "react-icons/bs";
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
import Tree, {
  mutateTree,
  moveItemOnTree,
  RenderItemParams,
  TreeItem,
  TreeData,
  ItemId,
  TreeSourcePosition,
  TreeDestinationPosition,
} from "@atlaskit/tree";
import { resetServerContext } from "react-beautiful-dnd";
import TreeBuilder from "~/utils/treeBuilder";

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
              as={Input}
              autoComplete="off"
            />
            <FormHInput
              labelWidth="60px"
              name="path"
              label="Path"
              as={PathInput}
              autoComplete="off"
              size="sm"
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

export const PathInput = ({ size, bg, ...rest }: InputProps) => {
  return (
    <InputGroup size={size} bg={bg}>
      <InputLeftAddon
        bg={bg}
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
      <Input {...rest} />
    </InputGroup>
  );
};

const SideNavContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const color = useColorModeValue("teal.800", "teal.100");
  const bg = useColorModeValue("blue.100", "blue.800");
  const fileNavBar = useMemo(() => {
    return <FileNavbar />;
  }, []);
  return (
    <Box pl={2} pt={2} pr={2}>
      <NavLink to={`/projects/${projectId}/apis`} end>
        {({ isActive }) => (
          <HStack
            h={8}
            pl={2}
            color={color}
            borderRadius={2}
            bg={isActive ? bg : undefined}
            _hover={{ background: isActive ? undefined : "blackAlpha.50" }}
          >
            <Icon as={FiAirplay} mt={0.5} />
            <Text userSelect={"none"}>Overview</Text>
          </HStack>
        )}
      </NavLink>
      {fileNavBar}
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

const FileNavbar = () => {
  const matches = useMatches();
  const project: Project = matches[1].data.project;
  const [treeData, setTreeData] = useState<TreeData>(
    new TreeBuilder("1", null)
  );
  invariant(project);
  useEffect(() => {
    const complexTree = new TreeBuilder(1, null);
    const generateTreeData = (group: Group, builder: TreeBuilder) => {
      for (let g of group.groups) {
        const childTree = new TreeBuilder(g.id, g);
        generateTreeData(g, childTree);
        builder.withSubTree(childTree);
      }
      for (let api of group.apis) {
        builder.withLeaf(api.id, api);
      }
    };
    generateTreeData(project.root, complexTree);
    setTreeData(complexTree.build());
  }, []);

  invariant(project);
  const renderItem = ({
    item,
    onExpand,
    onCollapse,
    provided,
  }: RenderItemParams) => {
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        {item.data.data ? (
          <File key={item.id} api={item.data} />
        ) : (
          <Folder
            key={item.id}
            group={item.data}
            isExpanded={item.isExpanded}
            itemId={item.id}
            onExpand={onExpand}
            onCollapse={onCollapse}
            onAdd={() => {}}
            onDelete={() => {}}
          />
        )}
      </div>
    );
  };

  const onExpand = (itemId: ItemId) => {
    console.info(itemId);
    setTreeData(mutateTree(treeData, itemId, { isExpanded: true }));
  };

  const onCollapse = (itemId: ItemId) => {
    setTreeData(mutateTree(treeData, itemId, { isExpanded: false }));
  };
  const onDragEnd = (
    source: TreeSourcePosition,
    destination?: TreeDestinationPosition
  ) => {
    if (!destination) {
      return;
    }
    setTreeData(moveItemOnTree(treeData, source, destination));
  };
  resetServerContext();
  return (
    <Flex flexDir={"column"}>
      <Tree
        tree={treeData}
        renderItem={renderItem}
        onExpand={onExpand}
        onCollapse={onCollapse}
        onDragEnd={onDragEnd}
        isDragEnabled
      />
    </Flex>
  );
};

const Folder = ({
  group,
  itemId,
  isExpanded,
  onExpand,
  onCollapse,
  onDelete,
  onAdd,
}: {
  group: Group;
  itemId: ItemId;
  isExpanded?: boolean;
  onExpand: (itemId: ItemId) => void;
  onCollapse: (itemId: ItemId) => void;
  onDelete: (value: string) => void;
  onAdd: (value: string) => void;
}) => {
  const { projectId, groupId } = useParams<{
    projectId: string;
    groupId: string;
  }>();
  const isActive = groupId === group.id;
  const bg = useColorModeValue("blue.200", "blue.800");
  const iconColor = useColorModeValue("blackAlpha.600", "whiteAlpha.800");
  const hoverColor = useColorModeValue("blue.100", "blue.600");
  return (
    <Flex border={"none"} flexDir="column">
      <HStack
        spacing={0}
        w="full"
        borderRadius={2}
        _hover={{ background: isActive ? undefined : hoverColor }}
        cursor="pointer"
        role="group"
        h={8}
        bg={isActive ? bg : undefined}
        onClick={(_e) =>
          isActive
            ? isExpanded
              ? onDelete(group.id)
              : onAdd(group.id)
            : undefined
        }
      >
        <Center
          mr={1}
          w="4"
          h="4"
          borderRadius={"full"}
          _groupHover={{ background: "blackAlpha.50" }}
          onClick={() => (isExpanded ? onCollapse(itemId) : onExpand(itemId))}
        >
          <Icon
            as={isExpanded ? BsFillCaretDownFill : BsFillCaretRightFill}
            color={iconColor}
            fontSize={10}
          />
        </Center>
        <Box
          as={RemixLink}
          flexGrow={1}
          display="flex"
          alignItems={"center"}
          to={`/projects/${projectId}/apis/groups/${group.id}`}
        >
          <Icon
            as={isExpanded ? BsFolder2Open : FiFolder}
            fontWeight="100"
            color={iconColor}
            mr={2}
          />
          <Text py={1} userSelect={"none"}>
            {group.name}
          </Text>
        </Box>
      </HStack>
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

const File = ({ api }: { api: Api }) => {
  const { projectId, apiId } = useParams();
  const bg = useColorModeValue("blue.200", "blue.800");
  const isActive = api.id === apiId;
  invariant(projectId);
  const hoverColor = useColorModeValue("blue.100", "blue.600");
  return (
    <Flex
      as={RemixLink}
      to={`/projects/${projectId}/apis/details/${api.id}`}
      h="8"
      _hover={{ background: isActive ? undefined : hoverColor }}
      bg={isActive ? bg : undefined}
      cursor="pointer"
    >
      <HStack w="full" spacing={0} borderRadius={2}>
        <MethodTag method={api.data.method} />
        <Text noOfLines={1}>{api.data.name}</Text>
      </HStack>
    </Flex>
  );
};

export default function Apis() {
  return <Outlet />;
}
