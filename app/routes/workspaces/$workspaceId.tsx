import {
  Button,
  Flex,
  Input,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
} from "@chakra-ui/react";
import { User } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useLoaderData, useTransition } from "@remix-run/react";
import { FiPlus } from "react-icons/fi";
import invariant from "tiny-invariant";
import Validator from "validatorjs";
import { createProject } from "~/models/project.server";
import { getWorkspaceById } from "~/models/workspace.server";
import { requireUser } from "~/session.server";
import { Action } from "../workspaces.parts/constants";
import NewProjectModal, {
  newProjectAction,
} from "../workspaces.parts/NewProjectModal";

export const loader = async ({ params }: LoaderArgs) => {
  let { workspaceId } = params;
  invariant(workspaceId, "workspaceId is null");
  let workspace = await getWorkspaceById(workspaceId);

  return json({ workspace });
};

export const action = async ({ request, params }: ActionArgs) => {
  let user = await requireUser(request);
  let { workspaceId } = params;

  invariant(workspaceId, "workspaceId is null");
  let formData = await request.formData();

  switch (formData.get("_action")) {
    case Action.NEW_PROJECT:
      return newProjectAction({ formData, user, workspaceId });
    default:
      return json({
        status: 400,
      });
  }

  const data = Object.fromEntries(await request.formData());

  return json({ status: "success" });

  switch (data._action) {
    case Action.NEW_WORKSPACE:
      return createProjectAction(data, user, workspaceId);
    default:
      return {
        status: 400,
      };
  }
};

const createProjectAction = async (
  data: {
    [k: string]: FormDataEntryValue;
  },
  user: User,
  workspaceId: string | undefined
) => {
  const validator = new Validator(
    {
      ...data,
      workspaceId,
    },
    {
      name: ["required", "string"],
      workspaceId: ["required", "string"],
    }
  );

  if (validator.fails()) {
    return json({
      errors: validator.errors.errors,
      status: 400,
    });
  }

  let project = await createProject(
    user,
    data.name as string,
    workspaceId as string,
    []
  );

  return json(project);
};

export default function Workspace() {
  const { workspace } = useLoaderData<typeof loader>();
  const transition = useTransition();

  return (
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
  );
}

function Projects() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { workspace } = useLoaderData<typeof loader>();
  return (
    <Flex
      flexDirection="row"
      justifyContent="space-between"
      p={3}
      borderRadius="md"
      background={"cyan.50"}
    >
      <Input maxW={96} placeholder="Search project" />
      <Button
        onClick={onOpen}
        leftIcon={<FiPlus />}
        colorScheme="pink"
        variant="solid"
      >
        Project
      </Button>
      <NewProjectModal
        users={workspace.users}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Flex>
  );
}
