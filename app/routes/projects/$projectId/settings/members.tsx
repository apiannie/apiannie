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
} from "@chakra-ui/react";
import { FiPlus, FiTrash } from "react-icons/fi";
import { Header } from "~/ui";

export default function () {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box py={"32px"} px={12} fontSize="sm">
      <Flex>
        <Header>{1} Members</Header>
        <Spacer />
        <Button size="sm" colorScheme={"blue"} onClick={onOpen}>
          <Icon as={FiPlus} mr={1} /> New Member
        </Button>
      </Flex>
      <Divider />
      <TableContainer mt={"10px"}>
        <Table variant="striped">
          <Tbody
            height={"calc(100vh - 183px)"}
            display={"block"}
            overflowY={"auto"}
          >
            {[].map((api) => (
              <Tr
                key={api.id}
                display={"table"}
                width={"100%"}
                style={{ tableLayout: "fixed" }}
              >
                <Td>{api.data.name}</Td>
                <Td>
                  <Flex alignItems={"center"}>
                    <Text ml={2}>{api.data.path}</Text>
                  </Flex>
                </Td>
                <Td isNumeric>
                  <Button size="sm">
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
