import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  HeadingProps,
  Icon,
  Spacer,
  Table,
  TableCaption,
  TableContainer,
  Thead,
  Tr,
  Th,
  Td,
  Text,
  useDisclosure,
  Tbody,
  Tfoot,
  useColorModeValue,
  Link,
} from "@chakra-ui/react";
import { RequestMethod } from "@prisma/client";
import { Link as RemixLink, useMatches, useParams } from "@remix-run/react";
import { FiPlus } from "react-icons/fi";
import invariant from "tiny-invariant";
import { Api, Group, Project } from "~/models/project.server";
import { Header } from "~/ui";
import { NewApiModal, useMethodTag } from "../apis";

export const handle = {
  tabs: ["Overview"],
};

export default function ApiOverview() {
  const matches = useMatches();
  const { projectId } = useParams();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const blue = useColorModeValue("blue.700", "blue.200");
  let project = matches[1].data.project as Project;
  invariant(project);
  invariant(projectId);
  let apis: Api[] = [];
  let groupMap = new Map<string, Group>();
  let stack = [project.root];
  while (stack.length > 0) {
    let group = stack.pop();
    invariant(group);
    groupMap.set(group.id, group);
    stack = stack.concat(group.groups);
    apis = apis.concat(group.apis);
  }

  if (apis.length === 0) {
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

  return (
    <Box py={8} px={12} fontSize="sm">
      <Flex>
        <Header>{apis.length} API definition</Header>
        <Spacer />
        <Button size="sm" colorScheme={"blue"} onClick={onOpen}>
          <Icon as={FiPlus} mr={1} /> New API
        </Button>
        <NewApiModal isOpen={isOpen} onClose={onClose} />
      </Flex>
      <Divider />
      <TableContainer mt={4}>
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Path</Th>
              <Th isNumeric>Group</Th>
            </Tr>
          </Thead>
          <Tbody>
            {apis.map((api) => (
              <Tr key={api.id}>
                <Td>
                  <Link
                    color={blue}
                    as={RemixLink}
                    to={`/projects/${projectId}/apis/details/${api.id}`}
                  >
                    {api.data.name}
                  </Link>
                </Td>
                <Td>
                  <Flex alignItems={"center"}>
                    <MethodTag method={api.data.method} />
                    <Text ml={2}>{api.data.path}</Text>
                  </Flex>
                </Td>
                <Td isNumeric>{groupMap.get(api.groupId || "")?.name}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

const MethodTag = ({ method }: { method: RequestMethod }) => {
  let { text, color } = useMethodTag(method);

  return (
    <Text fontWeight={700} fontSize="sm" color={color}>
      {method.toUpperCase()}
    </Text>
  );
};
