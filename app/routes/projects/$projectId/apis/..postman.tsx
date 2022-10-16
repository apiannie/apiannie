import { RequestParam } from ".prisma/client";
import {
  Box,
  Button,
  Center,
  Checkbox,
  Divider,
  Flex,
  Grid,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  Select,
  Tab,
  Table,
  TableContainer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { useLoaderData, useMatches, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { FormInput, ModalInput } from "~/ui";
import { loader } from "./details.$apiId";

const Postman = () => {
  const matches = useMatches();
  const { projectId } = useParams();
  invariant(projectId);
  let tabWidth = "150px";
  const bg = useColorModeValue("gray.50", "gray.900");
  const { api } = useLoaderData<typeof loader>();
  return (
    <Grid
      h="full"
      templateRows={"130px 1fr 250px"}
      as={Tabs}
      variant="soft-rounded"
      colorScheme="blue"
    >
      <Box overflowY={"auto"}>
        <Flex p={4} as={InputGroup}>
          <InputLeftAddon
            children={
              <Select
                name="method"
                variant="unstyled"
                placeholder="GET"
                disabled
              ></Select>
            }
          />
          <Input flex={"1"} w="auto" placeholder="http://example.com" />
          <InputRightAddon
            flex="1"
            w="auto"
            as={Input}
            disabled
            value={api.data.path}
          ></InputRightAddon>
          <Button ml="2" w="100px" colorScheme="blue">
            Send
          </Button>
        </Flex>
        <Divider />
        <TabList bg={bg} p={2} textAlign="center" justifyContent={"center"}>
          <Tab w={tabWidth}>Path</Tab>
          <Tab w={tabWidth}>Query</Tab>
          <Tab w={tabWidth}>Body</Tab>
          <Tab w={tabWidth}>Headers</Tab>
          <Tab w={tabWidth}>Cookies</Tab>
        </TabList>
        <Divider />
      </Box>
      <Box bg={bg} as={TabPanels} overflowY="auto">
        <TabPanel>
          <p>one!</p>
        </TabPanel>
        <TabPanel>
          <ParamTable prefix="" data={api.data.queryParams} />
        </TabPanel>
      </Box>
      <Box bg={useColorModeValue("gray.100", "gray.700")}></Box>
    </Grid>
  );
};

const ParamTable = ({
  prefix,
  withType,
  data,
}: {
  prefix: string;
  withType?: boolean;
  data: RequestParam[];
}) => {
  const bgBW = useColorModeValue("white", "gray.900");
  console.log(data);
  return (
    <TableContainer>
      <Table size={"sm"} colorScheme="teal">
        <Thead>
          <Tr>
            <Th width={"20%"}>Name</Th>
            <Th width={"30%"}>Value</Th>
            {withType && <Th>Type</Th>}
            <Th>Description</Th>
          </Tr>
        </Thead>
        <Tbody verticalAlign={"baseline"}>
          {data.map((param, i) => (
            <Tr key={i}>
              <Td>{param.name}</Td>
              <Td>
                <Input
                  bg={bgBW}
                  size="sm"
                  name={`${prefix}.${param.name}.example`}
                  defaultValue={param.example || undefined}
                />
              </Td>
              {withType && <Td>{param.type}</Td>}
              <Td>{param.description}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Box textAlign={"center"} mt={4}></Box>
    </TableContainer>
  );
};

export default Postman;
