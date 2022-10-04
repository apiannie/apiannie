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
} from "@chakra-ui/react";
import { ActionArgs, json } from "@remix-run/node";
import { Link, useMatches } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconType } from "react-icons";
import {
  FiAirplay,
  FiChevronDown,
  FiChevronRight,
  FiCopy,
  FiFilePlus,
  FiFolderPlus,
} from "react-icons/fi";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
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
  let { projectId } = params;

  invariant(projectId);

  switch (formData.get("_action")) {
    case Action.NEW_GROUP:
      const user = await requireUser(request);
      return json(await newGroupAction(formData, projectId));
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
  return createGroup({ parentId: parentId, projectId: projectId, name });
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
  parentId,
}: {
  isOpen: ModalProps["isOpen"];
  onClose: ModalProps["onClose"];
  parentId?: string;
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
          <input name="projectId" value={parentId} type="hidden" />
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
            <Text>Overview</Text>
          </HStack>
        )}
      </NavLink>
      <FileNavbar />
    </Box>
  );
};

const FileNavbar = ({ as }: {}) => {
  const matches = useMatches();
  const project: Project = matches[1].data.project;
  invariant(project);
  return (
    <Accordion allowMultiple reduceMotion>
      {project.root.groups.map((group) => (
        <Folder key={group.id} group={group} depth={0} />
      ))}
      {project.root.apis.map((api) => (
        <File key={api.id} api={api} depth={0} />
      ))}
    </Accordion>
  );
};

const FolderIcon = ({ isExpanded }: { isExpanded: boolean }) => {
  return (
    <Center
      mr={1}
      w="4"
      h="4"
      borderRadius={"full"}
      _groupHover={{ background: "blackAlpha.50" }}
    >
      <Icon as={isExpanded ? FiChevronDown : FiChevronRight} fontSize="12px" />
    </Center>
  );
};

const Folder = ({ depth, group }: { group: Group; depth: number }) => {
  const { projectId, groupId } = useParams<{
    projectId: string;
    groupId: string;
  }>();
  const isActive = groupId === group.id;
  return (
    <AccordionItem border={"none"}>
      {({ isExpanded }) => (
        <>
          <Link to={`/projects/${projectId}/apis/groups/${group.id}`}>
            {isExpanded && !isActive ? (
              <Flex
                pl={`${8 + depth * 12}px`}
                _hover={{ background: "blackAlpha.50" }}
                cursor="pointer"
                role="group"
                h={8}
              >
                <AccordionButton
                  _hover={{ background: undefined }}
                  w="inherit"
                  p={0}
                >
                  <FolderIcon isExpanded={isExpanded} />
                </AccordionButton>
                <Center>{group.name}</Center>
              </Flex>
            ) : (
              <AccordionButton
                pl={`${8 + depth * 12}px`}
                _hover={{ background: isActive ? undefined : "blackAlpha.50" }}
                cursor="pointer"
                role="group"
                h={8}
                bg={
                  isActive
                    ? useColorModeValue("blue.100", "blue.800")
                    : undefined
                }
              >
                <FolderIcon isExpanded={isExpanded} />
                <Text>{group.name}</Text>
              </AccordionButton>
            )}
          </Link>

          <AccordionPanel p={0}>
            {group.groups.map((g) => (
              <Folder group={g} depth={depth + 1} />
            ))}
          </AccordionPanel>
        </>
      )}
    </AccordionItem>
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
