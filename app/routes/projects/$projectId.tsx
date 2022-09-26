import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  BoxProps,
  Button,
  Divider,
  Flex,
  FlexProps,
  Grid,
  GridItem,
  Heading,
  Hide,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  List,
  ListIcon,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Skeleton,
  Spacer,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { Project, User } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import {
  Form,
  Link as RemixLink,
  NavLink,
  Outlet,
  useFetcher,
  useLoaderData,
  useMatches,
  useParams,
  useTransition,
} from "@remix-run/react";
import { ReactNode } from "react";
import { IconType } from "react-icons";
import {
  FiActivity,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiList,
  FiMenu,
  FiSettings,
} from "react-icons/fi";
import invariant from "tiny-invariant";
import logo from "~/images/logo_128.png";
import {
  getProjectById,
  getProjectsByWorkspaceIds,
} from "~/models/project.server";
import { getWorkspaceById } from "~/models/workspace.server";
import { requireUser } from "~/session.server";
import { httpResponse, useUser } from "~/utils";
import ColorModeButton from "../home/#lib/ColorModeButton";
import UserMenuButton from "../home/#lib/UserMenuButton";

export const loader = async ({ request, params }: LoaderArgs) => {
  let user = await requireUser(request);

  let { projectId } = params;
  if (!projectId) {
    throw httpResponse.NotFound;
  }

  let project = await getProjectById(projectId);

  if (!project) {
    throw httpResponse.NotFound;
  }

  let workspace = await getWorkspaceById(project.workspaceId);
  invariant(
    workspace,
    `workspace ${project.workspaceId} for project ${project.id} does not exist`
  );

  return json({ user: user, project: project, workspace: workspace });
};

export const action = async ({ request, params }: LoaderArgs) => {
  let formData = await request.formData();

  switch (formData.get("_action")) {
    case "LOAD_WORKSPACE_PROJECTS":
      const user = await requireUser(request);
      return json(await loadProjects(user));
    default:
      throw httpResponse.NotFound;
  }
};

const loadProjects = async (user: User) => {
  const workspaceIds = user.workspaces.map((workspace) => workspace.id);
  let projects = await getProjectsByWorkspaceIds(workspaceIds);
  let projectsMap: Record<string, typeof projects> = {};

  projects.forEach((project) => {
    projectsMap[project.workspaceId] ||= [];
    projectsMap[project.workspaceId].push(project);
  });

  let workspaces = user.workspaces.map((workspace) => ({
    projects: projectsMap[workspace.id],
    ...workspace,
  }));
  return { workspaces };
};

export default function Layout({ children }: { children: ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const width = 96;
  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <Hide below="md">
        <SidebarContent w={{ base: "full", md: width }} />
      </Hide>
      <MobileNav h="12" onOpen={onOpen} ml={{ base: 0, md: width }} />
      <Box ml={{ base: 0, md: width }} p="4">
        <Outlet />
      </Box>
    </Box>
  );
}

interface SidebarProps extends BoxProps {}

const SidebarContent = ({ ...rest }: SidebarProps) => {
  const { project } = useLoaderData<typeof loader>();
  const matches = useMatches();

  const sideNav = matches[matches.length - 1]?.handle?.sideNav;

  return (
    <Grid
      transition="3s ease"
      pos="fixed"
      h="full"
      templateColumns={"80px 1fr"}
      templateRows={"56px 1fr"}
      {...rest}
    >
      <GridItem
        rowSpan={2}
        flexDirection={"column"}
        bg={useColorModeValue("cyan.50", "gray.700")}
        borderRight="1px"
        borderRightColor={useColorModeValue("gray.200", "gray.600")}
        display={"flex"}
      >
        <RemixLink to={"/workspaces"}>
          <Image src={logo} p={5} _hover={{ opacity: 0.8 }} />
        </RemixLink>
        <Divider mb={2} />
        <SubMenuItem
          to={`/projects/${project.id}/apis`}
          icon={FiGrid}
          name="Apis"
        />
        <SubMenuItem
          to={`/projects/${project.id}/activities`}
          icon={FiActivity}
          name="Activities"
        />
        <Spacer />
        <SubMenuItem
          to={`/projects/${project.id}/settings`}
          icon={FiSettings}
          name="Settings"
        />
      </GridItem>
      <GridItem
        p={2}
        bg={useColorModeValue("teal.50", "gray.800")}
        borderRightWidth="1px"
        borderRightColor={useColorModeValue("gray.200", "gray.700")}
      >
        <ProjecChangeButton />
      </GridItem>
      <GridItem
        bg={useColorModeValue("teal.50", "gray.800")}
        borderRightWidth="1px"
        borderRightColor={useColorModeValue("gray.200", "gray.700")}
      >
        {sideNav}
      </GridItem>
    </Grid>
  );
};

const ProjecChangeButton = () => {
  const fetcher = useFetcher<Awaited<ReturnType<typeof loadProjects>>>();
  const { project } = useLoaderData<typeof loader>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const transition = useTransition();

  let workspaces = fetcher.data?.workspaces || [];
  let defaultIndex = workspaces.findIndex(
    (workspace) => workspace.id === project.workspaceId
  );

  return (
    <Box>
      <fetcher.Form method="post">
        <Button
          name="_action"
          value="LOAD_WORKSPACE_PROJECTS"
          w="full"
          variant="ghost"
          onClick={onOpen}
          type="submit"
        >
          <Heading whiteSpace={"normal"} maxW={64} size={"md"} noOfLines={1}>
            {project.name}
          </Heading>
          <Flex direction="column" px={1}>
            <Icon as={FiChevronUp} w={3} h={3} />
            <Icon as={FiChevronDown} w={3} h={3} />
          </Flex>
        </Button>
      </fetcher.Form>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader textAlign={"center"}>Switch project</ModalHeader>
          <ModalBody>
            {fetcher.data ? (
              <Accordion defaultIndex={[defaultIndex]} allowMultiple>
                {workspaces.map((workspace) => (
                  <AccordionItem key={workspace.id}>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <strong>{workspace.name}</strong>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      {workspace.projects.map((pro) => (
                        <List spacing={3} key={pro.id}>
                          <ListItem>
                            <RemixLink to={`/projects/${pro.id}`}>
                              <Box
                                h="full"
                                _hover={{
                                  bg: "cyan.200",
                                  color: "white",
                                }}
                                onClick={onClose}
                                py={1}
                              >
                                <ListIcon as={FiList} color="green.500" />
                                {pro.name}
                              </Box>
                            </RemixLink>
                          </ListItem>
                        </List>
                      ))}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Stack>
                <Skeleton height="20px" />
                <Skeleton height="20px" />
                <Skeleton height="20px" />
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button w={36} mx="auto" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

interface SubMenuItemProps extends BoxProps {
  to: string;
  icon: IconType;
  name: string;
}

const SubMenuItem = ({ to, icon, name, ...rest }: SubMenuItemProps) => {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Box
          py={3}
          textAlign={"center"}
          color={
            isActive
              ? useColorModeValue("blue.600", "blue.300")
              : useColorModeValue("gray.400", "gray.600")
          }
          _hover={{
            bg: "cyan.200",
            color: "white",
          }}
          {...rest}
        >
          <Icon w={7} h={7} as={icon} />
          <Text fontSize={"12px"}>{name}</Text>
        </Box>
      )}
    </NavLink>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: ReactNode;
  active?: boolean;
}
const NavItem = ({ icon, children, active, ...rest }: NavItemProps) => {
  return (
    <Flex
      align="center"
      p="3"
      mx="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      _hover={
        active
          ? undefined
          : {
              bg: "cyan.200",
              color: "white",
            }
      }
      bg={active ? "cyan.400" : undefined}
      color={active ? "white" : undefined}
      {...rest}
    >
      {icon && (
        <Icon
          mr="4"
          fontSize="16"
          _groupHover={{
            color: "white",
          }}
          as={icon}
        />
      )}
      {children}
    </Flex>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  const user = useUser();

  return (
    <Flex
      px={{ base: 4, md: 4 }}
      alignItems="center"
      bg={useColorModeValue("teal.50", "gray.800")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: "flex", md: "none" }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
      >
        Logo
      </Text>

      <HStack spacing={{ base: "0", md: "6" }}>
        <ColorModeButton />
        <IconButton
          size="md"
          variant="ghost"
          aria-label="open menu"
          icon={<FiBell />}
        />
        <UserMenuButton avatar={user.avatar || undefined} />
      </HStack>
    </Flex>
  );
};
