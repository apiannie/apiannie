import {
  Box,
  Container,
  Divider,
  Heading,
  HeadingProps,
  Input,
  Tab,
  Table,
  TableCaption,
  TableContainer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm } from "remix-validated-form";
import { z } from "zod";
import { FormHInput } from "~/ui";
import { PathInput } from "../apis";

export default function ApiInfo() {
  return (
    <Box pt={2} px={2}>
      <Tabs>
        <TabList>
          <Tab>Info</Tab>
          <Tab>Edit</Tab>
          <Tab>Exec</Tab>
          <Tab>Mock</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <p>one!</p>
          </TabPanel>
          <TabPanel>
            <Edit />
          </TabPanel>
          <TabPanel>
            <p>three!</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

const validator = withZod(z.object({}));

const Header = (props: HeadingProps) => {
  return (
    <Heading
      borderLeft={"3px solid #2395f1"}
      pl={2}
      size={"md"}
      mb={4}
      {...props}
    />
  );
};

const Edit = () => {
  const bg = useColorModeValue("gray.100", "gray.800");
  const bgBW = useColorModeValue("white", "gray.900");
  const gray = useColorModeValue("gray.300", "gray.600");
  const labelWidth = "80px";
  return (
    <Box as={ValidatedForm} p={2} validator={validator}>
      <Header>General</Header>
      <Box bg={bg} p={4}>
        <Container maxW="container.lg">
          <Box py={2}>
            <FormHInput
              isRequired
              bg={bgBW}
              labelWidth={labelWidth}
              name="name"
              label="Name"
              size="sm"
              input={Input}
              autoComplete="off"
            />
          </Box>
          <Box py={2}>
            <FormHInput
              isRequired
              bg={bgBW}
              labelWidth={labelWidth}
              name="path"
              label="Path"
              input={PathInput}
              autoComplete="off"
              size="sm"
            />
          </Box>
        </Container>
      </Box>

      <Header mt={6}>Params</Header>
      <Box bg={bg} p={4}>
        <Tabs variant="solid-rounded" colorScheme="blue">
          <TabList display={"flex"} justifyContent="center">
            <Tab flexBasis={"100px"}>Path</Tab>
            <Tab flexBasis={"100px"}>Query</Tab>
            <Tab flexBasis={"100px"}>Body</Tab>
            <Tab flexBasis={"100px"}>Headers</Tab>
          </TabList>
          <Divider my={2} borderColor={gray} />
          <TabPanels>
            <TabPanel>
              <Container maxW="container.lg">
                <PathTable />
              </Container>
            </TabPanel>
            <TabPanel>
              <p>two!</p>
            </TabPanel>
            <TabPanel>
              <p>3!</p>
            </TabPanel>
            <TabPanel>
              <p>4!</p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

const PathTable = () => {
  return (
    <TableContainer>
      <Table variant="simple">
        <TableCaption>Imperial to metric conversion factors</TableCaption>
        <Thead>
          <Tr>
            <Th>To convert</Th>
            <Th>into</Th>
            <Th isNumeric>multiply by</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>inches</Td>
            <Td>millimetres (mm)</Td>
            <Td isNumeric>25.4</Td>
          </Tr>
          <Tr>
            <Td>feet</Td>
            <Td>centimetres (cm)</Td>
            <Td isNumeric>30.48</Td>
          </Tr>
          <Tr>
            <Td>yards</Td>
            <Td>metres (m)</Td>
            <Td isNumeric>0.91444</Td>
          </Tr>
        </Tbody>
        <Tfoot>
          <Tr>
            <Th>To convert</Th>
            <Th>into</Th>
            <Th isNumeric>multiply by</Th>
          </Tr>
        </Tfoot>
      </Table>
    </TableContainer>
  );
};
