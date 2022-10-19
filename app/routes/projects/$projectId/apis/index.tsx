import { Box, Button, Center, Heading, useDisclosure } from "@chakra-ui/react";
import { useMatches } from "@remix-run/react";
import invariant from "tiny-invariant";
import { Api, Group, Project } from "~/models/project.server";
import { NewApiModal } from "../apis";

export const handle = {
  tabs: ["Overview"],
};

export default function ApiOverview() {
  const matches = useMatches();
  const { isOpen, onClose, onOpen } = useDisclosure();
  let project = matches[1].data.project as Project;
  invariant(project);
  let apis: Api[] = [];
  let groups: Group[] = [];
  let stack = [project.root];
  while (stack.length > 0) {
    let group = stack.pop();
    invariant(group);
    stack = stack.concat(group.groups);
    groups = groups.concat(group.groups);
    apis = apis.concat(group.apis);
  }

  return (
    <Center>
      <Box textAlign={"center"}>
        <Heading>Create your first API definition to continue</Heading>
        <Box pb={20} mt={40}>
          <Button onClick={onOpen} colorScheme={"teal"} p={10} size="lg">
            New API Definition
          </Button>
        </Box>
      </Box>
      <NewApiModal isOpen={isOpen} onClose={onClose} />
    </Center>
  );
}
