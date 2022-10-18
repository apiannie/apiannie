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
  Spacer,
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
  Textarea,
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
import { useIds } from "~/utils";
import { FiPlus, FiRepeat, FiRepeat } from "react-icons/fi";
import { ValidatedForm } from "remix-validated-form";
import { withZod } from "@remix-validated-form/with-zod";
import { z } from "zod";
import { ClientOnly } from "remix-utils";
import { lazy, useState } from "react";

const validator = withZod(z.object({}));
const AceEditor = lazy(() => import("~/ui/AceEditor"));

const Postman = () => {
  const { projectId } = useParams();
  invariant(projectId);
  let tabWidth = "150px";
  const bg = useColorModeValue("gray.50", "gray.800");
  const { api, url } = useLoaderData<typeof loader>();
  const origin = new URL(url).origin;

  const [bodyRaw, setBodyRaw] = useState(api.data.bodyRaw?.example || "");

  return (
    <Grid
      h="full"
      templateRows={"112px calc(50% - 112px / 2) calc(50% - 112px / 2)"}
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
          {/* <Tab fontSize={"sm"} w={tabWidth}>
            Cookies
          </Tab> */}
        </TabList>
      </Box>
      <TabPanels
        id="postman-form"
        bg={bg}
        as={ValidatedForm}
        validator={validator}
      >
        {api.data.pathParams.length > 0 && (
          <TabPanel>
            <ParamTable prefix="path" data={api.data.pathParams} />
          </TabPanel>
        )}
        <TabPanel h="full" p={0}>
          {api.data.bodyType === "FORM" ? (
            <Box p={4}>
              <ParamTable prefix="body" data={api.data.pathParams} />
            </Box>
          ) : (
            <BodyEditor
              value={bodyRaw}
              onChange={setBodyRaw}
              description={api.data.bodyRaw?.description || ""}
              isJson={api.data.bodyType === "JSON"}
            />
          )}
        </TabPanel>
        <TabPanel maxH="full" overflowY="auto">
          <ParamTable prefix="query" data={api.data.queryParams} />
        </TabPanel>
        <TabPanel maxH="full" overflowY="auto">
          <ParamTable prefix="header" data={api.data.headers} />
        </TabPanel>
        <TabPanel maxH="full" overflowY="auto">
          <ParamTable prefix="cookies" data={[]} />
        </TabPanel>
      </TabPanels>
      <Box bg={useColorModeValue("gray.100", "gray.700")} overflowY={"auto"}>
        <EmptyResponse />
      </Box>
    </Grid>
  );
};

const ParamTable = ({
  prefix,
  data,
}: {
  prefix: string;
  data: RequestParam[];
}) => {
  const bgBW = useColorModeValue("white", "gray.900");
  const { ids, pushId, removeId } = useIds(data.length === 0 ? 1 : 0);
  return (
    <TableContainer>
      <Table size={"sm"} colorScheme="teal" css={{ tableLayout: "fixed" }}>
        <Thead>
          <Tr>
            <Th p={0} w={8}></Th>
            <Th width={"25%"} pl={0}>
              <Text ml={3}>Name</Text>
            </Th>
            <Th p={0}>
              <Text ml={3}>Value</Text>
            </Th>
            <Th width="30%">Description</Th>
          </Tr>
        </Thead>
        <Tbody verticalAlign={"baseline"}>
          {data.map((param, i) => (
            <Tr key={i}>
              <Td p={0} pl={1}>
                <Checkbox
                  mr={2}
                  isChecked={param.isRequired ? true : undefined}
                  isDisabled={param.isRequired}
                  defaultChecked
                />
              </Td>
              <Td pl={0}>
                <FormControl isRequired={param.isRequired}>
                  <FormLabel fontSize={"sm"} m={0}>
                    <Text ml={3} as={"span"}>
                      {param.name}
                    </Text>
                  </FormLabel>
                </FormControl>
              </Td>
              <Td p={0}>
                <Input
                  borderWidth={0}
                  bg={bgBW}
                  size="sm"
                  name={`${prefix}.${param.name}`}
                  defaultValue={param.example || undefined}
                  placeholder="Value"
                />
              </Td>
              <Td>
                <Text textOverflow={"ellipsis"} overflow="hidden">
                  {param.description}
                </Text>
              </Td>
            </Tr>
          ))}
          {ids.map((id, i) => (
            <Tr key={id}>
              <Td p={0} pl={1}>
                <Checkbox mr={2} defaultChecked />
              </Td>
              <Td p={0} pr={4}>
                <FormInput
                  borderWidth={0}
                  bg={bgBW}
                  size="sm"
                  name={`${prefix}_ext[${i}].name`}
                  placeholder="Name"
                />
              </Td>
              <Td p={0}>
                <FormInput
                  borderWidth={0}
                  bg={bgBW}
                  size="sm"
                  name={`${prefix}_ext[${i}].value`}
                  placeholder="Value"
                />
              </Td>
              <Td></Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Box textAlign={"center"} mt={4}>
        <Button
          size="sm"
          colorScheme="blue"
          variant={"outline"}
          onClick={pushId}
        >
          <Icon as={FiPlus} /> Add
        </Button>
      </Box>
    </TableContainer>
  );
};

const BodyEditor = ({
  description,
  value,
  onChange,
  isJson,
}: {
  onChange?: (value: string, event?: any) => void;
  value?: string;
  description?: string;
  isJson?: boolean;
}) => {
  const bgBW = useColorModeValue("white", "gray.900");
  const [mode, setMode] = useState(isJson ? "json" : "plain_text");
  return (
    <Grid h="full" w="full" templateColumns={"3fr 1fr"}>
      <Box h="full">
        <ClientOnly>
          {() => (
            <AceEditor
              mode={mode}
              theme="github"
              editorProps={{ $blockScrolling: true }}
              height="100%"
              width="100%"
              showGutter={true}
              showPrintMargin={false}
              value={value}
              onChange={onChange}
              tabSize={2}
            />
          )}
        </ClientOnly>
      </Box>

      {isJson ? (
        <Box h="full">
          <HStack>
            <Heading h={8} p={2} size="sm">
              Json
            </Heading>
            <Spacer />
          </HStack>
          <Divider />
          <Center h="calc(100% - 32px)">
            <Button size="sm" variant={"outline"} colorScheme="blue">
              <Icon as={FiRepeat} mr={2} />
              Generate
            </Button>
          </Center>
        </Box>
      ) : (
        <Box h="full">
          <HStack>
            <Heading p={2} size="sm">
              RAW
            </Heading>
            <Spacer />
            <Select
              variant={"unstyled"}
              width={20}
              size="sm"
              onChange={(e) => setMode(e.target.value)}
              value={mode}
            >
              <option value="plain_text">Text</option>
              <option value="json5">Json5</option>
              <option value="xml">XML</option>
            </Select>
          </HStack>
          <Divider />
          <Text p={2}>{description}</Text>
        </Box>
      )}
    </Grid>
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
