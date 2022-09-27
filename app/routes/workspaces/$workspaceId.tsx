import {
  Box,
  Button,
  CloseButton,
  Divider,
  Flex,
  FlexProps,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Link,
  SimpleGrid,
  Spacer,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import {
  useLoaderData,
  useTransition,
  Link as RemixLink,
  useParams,
} from "@remix-run/react";
import { FcList } from "react-icons/fc";
import { FiBell, FiLayers, FiMenu, FiPlus } from "react-icons/fi";
import invariant from "tiny-invariant";
import { getProjectsByWorkspaceId } from "~/models/project.server";
import { getWorkspaceById } from "~/models/workspace.server";
import { requireUser } from "~/session.server";
import { httpResponse, useUser } from "~/utils";
import { Action } from "./..lib/constants";
import NewProjectModal, { newProjectAction } from "./..lib/NewProjectModal";
import NewWorkspaceModal, {
  newWorkspaceAction,
} from "./..lib/NewWorkspaceModal";
import logo from "~/images/logo.png";
import { IconType } from "react-icons";
import { ReactNode } from "react";
import ColorModeButton from "../home/..lib/ColorModeButton";
import UserMenuButton from "../home/..lib/UserMenuButton";

export const loader = async ({ params }: LoaderArgs) => {
  let { workspaceId } = params;
  invariant(workspaceId, "workspaceId is null");
  let [workspace, projects] = await Promise.all([
    getWorkspaceById(workspaceId),
    getProjectsByWorkspaceId(workspaceId),
  ]);

  if (!workspace) {
    throw httpResponse.NotFound;
  }

  return json({ workspace, projects });
};

export const action = async ({ request, params }: ActionArgs) => {
  let user = await requireUser(request);
  let { workspaceId } = params;

  let formData = await request.formData();

  switch (formData.get("_action")) {
    case Action.NEW_WORKSPACE:
      return newWorkspaceAction({ formData, user });
    case Action.NEW_PROJECT:
      invariant(workspaceId, "workspaceId is null");
      return newProjectAction({ formData, user, workspaceId });
    default:
      return json({
        status: 400,
      });
  }
};

export default function Workspace() {
  const { workspace } = useLoaderData<typeof loader>();
  const transition = useTransition();
  const modal = useDisclosure();
  const user = useUser();
  const params = useParams();

  let workspaceId = params.workspaceId;

  if (transition.location?.pathname) {
    workspaceId = transition.location.pathname.substring("/workspaces/".length);
  }

  return (
    <Box bg={useColorModeValue("gray.100", "gray.900")}>
      <Grid templateColumns="288px 1fr">
        <Grid
          bg={useColorModeValue("white", "gray.900")}
          borderRight="1px"
          borderRightColor={useColorModeValue("gray.200", "gray.700")}
          h="100vh"
          templateRows={"100px 32px minmax(0, 1fr)"}
        >
          <Flex alignItems="center" mx="8" justifyContent="space-between">
            <Image src={logo} height="32px" m="auto" />
          </Flex>
          <GridItem>
            <HStack px={2}>
              <Heading ml="2" fontWeight={"500"} size={"sm"} color="gray.400">
                WORKSPACES
              </Heading>
              <Spacer />
              <Button
                size={"sm"}
                leftIcon={<FiPlus />}
                colorScheme="teal"
                variant="ghost"
              >
                Add
              </Button>
            </HStack>
            <NewWorkspaceModal isOpen={modal.isOpen} onClose={modal.onClose} />
            <Divider />
          </GridItem>
          <GridItem overflowY="auto">
            {user.workspaces.map((workspace) => (
              <Link
                to={`/workspaces/${workspace.id}`}
                as={RemixLink}
                style={{ textDecoration: "none" }}
                _focus={{ boxShadow: "none" }}
                key={workspace.id}
              >
                <NavItem icon={FiLayers} active={workspace.id === workspaceId}>
                  <Text noOfLines={1}>{workspace.name}</Text>
                </NavItem>
              </Link>
            ))}
          </GridItem>
        </Grid>
        <Grid h="100vh" templateRows={"56px minmax(0, 1fr)"}>
          <HStack
            px={{ base: 4, md: 4 }}
            height="full"
            alignItems="center"
            bg={useColorModeValue("white", "gray.900")}
            borderBottomWidth="1px"
            borderBottomColor={useColorModeValue("gray.200", "gray.700")}
            justifyContent={{ base: "space-between", md: "flex-end" }}
            spacing={{ base: "0", md: "6" }}
          >
            <ColorModeButton />
            <IconButton
              size="md"
              variant="ghost"
              aria-label="open menu"
              icon={<FiBell />}
            />
            <UserMenuButton avatar={user.avatar || undefined} />
          </HStack>
          <Tabs display={"grid"} gridTemplateRows="36px minmax(0, 1fr)">
            <TabList>
              <Tab>Projects</Tab>
              <Tab>Members</Tab>
              <Tab>Settings</Tab>
            </TabList>

            <TabPanels overflowY={"auto"}>
              <TabPanel>
                <Projects />
              </TabPanel>
              <TabPanel>
                <p>two!</p>
              </TabPanel>
              <TabPanel>
                <p>three!</p>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Grid>
      </Grid>
    </Box>
  );
}

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

const Projects = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { workspace, projects } = useLoaderData<typeof loader>();
  return (
    <Box>
      <SimpleGrid columns={[1, 2, 2, 3, 3, 4]} spacing={6}>
        {[null, ...projects].map((project) =>
          project ? (
            <ProjectItem key={project.id} project={project} />
          ) : (
            <Box key="add-project" onClick={onOpen}>
              <NewProjectModal
                users={workspace.users}
                isOpen={isOpen}
                onClose={onClose}
              />
              <ProjectItem project={null} />
            </Box>
          )
        )}
      </SimpleGrid>
    </Box>
  );
};

const ProjectItem = ({
  project,
}: {
  project: {
    name: string;
    id: string;
  } | null;
}) => {
  return (
    <Link
      isExternal
      href={project ? `/projects/${project.id}` : undefined}
      _hover={{
        textDecoration: "none",
      }}
    >
      <Flex
        borderStyle={project ? "solid" : "dashed"}
        height="80px"
        borderWidth={2}
        borderRadius="xl"
        borderColor="gray.500"
        bg="white.800"
        flexDirection="row"
        alignItems="center"
        justifyContent={project ? "flex-start" : "center"}
        _hover={{
          bg: "white",
        }}
        cursor="pointer"
      >
        <Icon as={project ? FcList : FiPlus} w={10} h={10} mx={2} />
        {project && (
          <Text
            overflow={"hidden"}
            textOverflow={"ellipsis"}
            fontSize="xl"
            noOfLines={2}
          >
            {project.name}
          </Text>
        )}
      </Flex>
    </Link>
  );
};
