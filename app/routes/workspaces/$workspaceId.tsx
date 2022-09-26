import {
  Box,
  Button,
  Flex,
  Icon,
  Link,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useLoaderData, useTransition } from "@remix-run/react";
import { FcList } from "react-icons/fc";
import { FiPlus } from "react-icons/fi";
import invariant from "tiny-invariant";
import { getProjectsByWorkspaceId } from "~/models/project.server";
import { getWorkspaceById } from "~/models/workspace.server";
import { requireUser } from "~/session.server";
import { httpResponse } from "~/utils";
import { Action } from "./..lib/constants";
import Layout from "./..lib/Layout";
import NewProjectModal, { newProjectAction } from "./..lib/NewProjectModal";
import { newWorkspaceAction } from "./..lib/NewWorkspaceModal";

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

  return (
    <Layout>
      <Tabs>
        <TabList>
          <Tab>Projects</Tab>
          <Tab>Members</Tab>
          <Tab>Settings</Tab>
        </TabList>

        <TabPanels>
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
    </Layout>
  );
}

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
