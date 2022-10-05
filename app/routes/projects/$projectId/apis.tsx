import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
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
  IconProps,
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
  Tooltip,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Link as RemixLink, useMatches } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect, useState } from "react";
import { IconType } from "react-icons";
import {
  FiAirplay,
  FiChevronDown,
  FiChevronRight,
  FiCopy,
  FiFilePlus,
  FiFolderPlus,
} from "react-icons/fi";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { array, string, z } from "zod";
import { createGroup } from "~/models/api.server";
import { Api, Group, Project } from "~/models/project.server";
import { requireUser } from "~/session.server";
import FormCancelButton from "~/ui/Form/FormCancelButton";
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

  invariant(projectId);

  switch (formData.get("_action")) {
    case Action.NEW_GROUP:
      const user = await requireUser(request);
      return await newGroupAction(formData, projectId);
    default:
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

const getActiveGroup = () => {
  let url = new URL(location.href);
  return url.searchParams.get("activeGroup");
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
          <FormInput name="name" label="Name" placeholder="Group name" />
          <input name="parentId" value={params.groupId} type="hidden" />
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
    name: z.string().min(1, "group name is required"),
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
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      validator={newGroupValidator}
      replace
      method="post"
      size="lg"
    >
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>Create group</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormInput name="name" label="Name" placeholder="Group name" />
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

const SideNavContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <Box>
      <NavLink to={`/projects/${projectId}/apis`} end>
        {({ isActive }) => (
          <HStack
            h={8}
            pl={2}
            color={useColorModeValue("teal.800", "teal.100")}
            bg={
              isActive ? useColorModeValue("blue.100", "blue.800") : undefined
            }
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
  const { groupId } = useParams();
  const { accordionMap, onAdd, onDelete } = useAccordion();

  invariant(project);

  useEffect(() => {
    let path: string[] = [];
    if (!groupId) {
      return;
    }
    for (let group of project.root.groups) {
      path = [];
      if (groupDFS(group, groupId, path)) {
        break;
      }
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
  onClick: () => void;
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
        pl={`${8 + depth * 12}px`}
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
        <Flex flexGrow={1}>
          <Box
            as={RemixLink}
            flexGrow={1}
            to={`/projects/${projectId}/apis/groups/${group.id}`}
          >
            <Text py={1} userSelect={"none"}>
              {group.name}
            </Text>
          </Box>
        </Flex>
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
      </Flex>
    </Flex>
  );
};

const File = ({ api, depth }: { api: Api; depth: number }) => {
  return (
    <Flex
      pl={`${24 + depth * 12}px`}
      h="8"
      _hover={{ background: "blackAlpha.50" }}
      cursor="pointer"
    >
      <Center>{api.name}</Center>
    </Flex>
  );
};

export default function Apis() {
  return <Outlet />;
}
