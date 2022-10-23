import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  Spacer,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  useDisclosure,
  Select,
} from "@chakra-ui/react";
import { ProjectUserRole } from "@prisma/client";
import { json, LoaderArgs, LoaderFunction } from "@remix-run/node";
import { useLoaderData, useMatches } from "@remix-run/react";
import { FiPlus, FiTrash } from "react-icons/fi";
import invariant from "tiny-invariant";
import { getProjectById } from "~/models/project.server";
import { getUserInfoByIds } from "~/models/user.server";
import { Header } from "~/ui";
import { httpResponse } from "~/utils";

export const loader = async ({ params }: LoaderArgs) => {
  let { projectId } = params;
  invariant(projectId);
  let project = await getProjectById(projectId);
  if (!project) {
    throw httpResponse.BadRequest;
  }
  let members = await getUserInfoByIds(project.members.map((item) => item.id));
  let roleMap = project.members.reduce((prev, curr) => {
    prev[curr.id] = curr.role;
    return prev;
  }, {} as { [key: string]: ProjectUserRole });
  let retval = members.map(
    (member) =>
      ({
        ...member,
        role: roleMap[member.id],
      } as typeof member & { role: ProjectUserRole })
  );
  return json({ members: retval });
};

export default function () {
  const { isOpen, onOpen, onClose } = useDisclosure();
  let { members } = useLoaderData<typeof loader>();

  return (
    <Box h="100%" overflowY={"auto"} px={12} py={9} fontSize="sm">
      <Flex>
        <Header>{1} Members</Header>
        <Spacer />
        <Button size="sm" colorScheme={"blue"} onClick={onOpen}>
          <Icon as={FiPlus} mr={1} /> Member
        </Button>
      </Flex>
      <Divider />
      <TableContainer mt={"10px"}>
        <Table size={"sm"}>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th w={40} isNumeric>
                Role
              </Th>
              <Th px={0} w={10}></Th>
            </Tr>
          </Thead>
          <Tbody>
            {members.map((member) => (
              <Tr key={member.id}>
                <Td>{member.name}</Td>
                <Td>
                  <Text>{member.email}</Text>
                </Td>
                <Td isNumeric>
                  <Select size="sm">
                    <option>Admin</option>
                    <option>Write</option>
                    <option>Read</option>
                  </Select>
                </Td>
                <Td px={0}>
                  <Button colorScheme={"red"} size="sm" variant={"ghost"}>
                    <Icon as={FiTrash} />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}
