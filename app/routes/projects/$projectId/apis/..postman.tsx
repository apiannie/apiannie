import { RequestParam } from ".prisma/client";
import {
  Box,
  Button,
  Center,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Icon,
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
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useLoaderData, useMatches, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { FormInput, ModalInput } from "~/ui";
import { loader } from "./details.$apiId";
import { SlRocket } from "react-icons/sl";

const Postman = () => {
  const matches = useMatches();
  const { projectId } = useParams();
  invariant(projectId);
  let tabWidth = "150px";
  const bg = useColorModeValue("gray.50", "gray.800");
  const { api, url } = useLoaderData<typeof loader>();
  const origin = new URL(url).origin;
  return (
    <Grid
      h="full"
      templateRows={"115px calc(50% - 115px / 2) calc(50% - 115px / 2)"}
      as={Tabs}
      colorScheme="blue"
      fontSize={"sm"}
    >
      <Box bg={bg}>
        <Flex p={4} as={InputGroup}>
          <InputLeftAddon fontSize={"sm"}>{api.data.method}</InputLeftAddon>
          <Input
            fontSize={"sm"}
            flex={"1"}
            w="auto"
            placeholder="http://example.com"
            defaultValue={`${origin}/mock/${projectId}`}
          />
          <InputRightAddon fontSize={"sm"} flex="1" w="auto">
            {api.data.path}
          </InputRightAddon>
          <Button ml="2" w="100px" colorScheme="blue">
            Send
          </Button>
        </Flex>
        <Divider />
        <TabList bg={bg} textAlign="center" justifyContent={"center"}>
          {api.data.pathParams.length > 0 && (
            <Tab fontSize={"sm"} w={tabWidth}>
              Path
            </Tab>
          )}
          <Tab fontSize={"sm"} w={tabWidth}>
            Body
          </Tab>
          <Tab fontSize={"sm"} w={tabWidth}>
            Query
          </Tab>
          <Tab fontSize={"sm"} w={tabWidth}>
            Headers
          </Tab>
          <Tab fontSize={"sm"} w={tabWidth}>
            Cookies
          </Tab>
        </TabList>
      </Box>
      <Box bg={bg} as={TabPanels} overflowY="auto">
        {api.data.pathParams.length > 0 && (
          <TabPanel>
            <ParamTable prefix="path" data={api.data.pathParams} />
          </TabPanel>
        )}
        <TabPanel>Body</TabPanel>
        <TabPanel>
          <ParamTable prefix="query" data={api.data.queryParams} />
        </TabPanel>
        <TabPanel>
          <ParamTable prefix="header" data={api.data.headers} />
        </TabPanel>
        <TabPanel>
          <ParamTable prefix="cookies" data={[]} />
        </TabPanel>
      </Box>
      <Box bg={useColorModeValue("gray.100", "gray.700")} overflowY={"auto"}>
        <EmptyResponse />
      </Box>
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
  return (
    <TableContainer>
      <Table size={"sm"} colorScheme="teal">
        <Thead>
          <Tr>
            <Th width={"25%"}>
              <Text pl={6}>Name</Text>
            </Th>
            <Th width={"40%"} p={0}>
              <Text ml={3}>Value</Text>
            </Th>
            {withType && <Th>Type</Th>}
            <Th>Description</Th>
          </Tr>
        </Thead>
        <Tbody verticalAlign={"baseline"}>
          {data.map((param, i) => (
            <Tr key={i}>
              <Td>
                <Checkbox
                  mr={2}
                  isChecked={param.isRequired ? true : undefined}
                  isDisabled={param.isRequired}
                  defaultChecked
                />
                <FormControl
                  display={"inline-block"}
                  isRequired={param.isRequired}
                >
                  <FormLabel fontSize={"sm"} m={0}>
                    <Text as={"span"}>{param.name}</Text>
                  </FormLabel>
                </FormControl>
              </Td>
              <Td p={0}>
                <Input
                  borderWidth={0}
                  bg={bgBW}
                  size="sm"
                  name={`${prefix}.${param.name}.example`}
                  defaultValue={param.example || undefined}
                  placeholder="Value"
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

const EmptyResponse = () => {
  return (
    <Center position={"relative"} h="full">
      <Text color="gray.400" p={4} position={"absolute"} top={0} left={0}>
        Response
      </Text>
      <VStack color="blue.300">
        <Icon as={SlRocket} w={20} h={20} />
        <br />
        <Text>Click the "Send" button to get the return results</Text>
      </VStack>
    </Center>
  );
};

export default Postman;
