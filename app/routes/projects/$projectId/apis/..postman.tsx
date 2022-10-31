import { ApiData, RequestParam } from ".prisma/client";
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
  GridItem,
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
  Tag,
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
import { AceEditor, FormInput, ModalInput } from "~/ui";
import { loader } from "./details.$apiId";
import { SlRocket } from "react-icons/sl";
import { methodContainsBody, useIds } from "~/utils";
import { FiAlertOctagon, FiPlus, FiRepeat, FiTrash2 } from "react-icons/fi";
import {
  useFormContext,
  ValidatedForm,
  ValidatorData,
} from "remix-validated-form";
import { withZod } from "@remix-validated-form/with-zod";
import { any, z } from "zod";
import { ClientOnly } from "remix-utils";
import {
  lazy,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const zodParam = z
  .object({
    checked: z
      .string()
      .optional()
      .transform((v) => v !== undefined),
    name: z.string().optional(),
    value: z.string().optional(),
  })
  .array()
  .default([]);

const validator = withZod(
  z.object({
    query: zodParam,
    query_ext: zodParam,
    header: zodParam,
    header_ext: zodParam,
    bodyForm: zodParam,
    bodyForm_ext: zodParam,
  })
);

const Postman = () => {
  const { projectId } = useParams();
  invariant(projectId);
  let tabWidth = "150px";
  const bg = useColorModeValue("gray.50", "gray.800");
  const { api, url } = useLoaderData<typeof loader>();
  const origin = new URL(url).origin;
  const [bodyRaw, setBodyRaw] = useState(api.data.bodyRaw?.example || "");
  const form = useFormContext("postman-form");
  const [location, setLocation] = useState(`${origin}/mock/${projectId}`);
  const [response, setResponse] = useState<AxiosResponse | null>(null);
  const [error, setError] = useState<any>(null);
  const methodHasBody = methodContainsBody(api.data.method);
  const onSubmit: React.MouseEventHandler<HTMLButtonElement> =
    useCallback(async () => {
      let formData = form.getValues();
      let result = await validator.validate(formData);
      let data = result.data;
      if (!data) {
        // TODO
        return;
      }

      let query = Array<typeof data.query[0]>()
        .concat(data.query, data.query_ext)
        .filter((param) => param.checked && !!param.name);

      let header = Array<typeof data.header[0]>()
        .concat(data.header, data.header_ext)
        .filter((param) => param.checked && !!param.name);

      let config: AxiosRequestConfig = {
        method: api.data.method,
        url: location + api.data.path,
        maxRedirects: 0,
        validateStatus: () => true,
      };

      let queries: typeof config["params"] = {};
      for (let elem of query) {
        invariant(elem.name);
        queries[elem.name] = elem.value;
      }

      let headers: typeof config["headers"] = {};
      for (let elem of header) {
        invariant(elem.name);
        headers[elem.name] = elem.value;
      }

      config.headers = headers;
      config.params = queries;

      if (methodHasBody) {
        if (api.data.bodyType === "FORM") {
          let bodyForm = Array<typeof data.header[0]>()
            .concat(data.bodyForm, data.bodyForm_ext)
            .filter((param) => param.checked && !!param.name);
          let formD = new FormData();
          for (let elem of bodyForm) {
            invariant(elem.name);
            formD.append(elem.name, elem.value || "");
          }
          config.data = formD;
        }
      }

      try {
        let res = await axios(config);
        setResponse(res);
        setError(null);
      } catch (err: any) {
        setError(err);
      }
    }, [form, location]);
  const responseDragRef = useRef<HTMLDivElement>();
  const gridContainerRef = useRef<HTMLDivElement>();
  const lastClientY = useRef(0);
  const lastResponseHeight = useRef(0);
  useEffect(() => {
    lastResponseHeight.current = (window.innerHeight - 112) / 2;
    const mousedown = (e: MouseEvent) => {
      if (e.target !== responseDragRef.current) {
        return;
      }
      lastClientY.current = e.clientY;
      const handleMove = ({ clientY }: { clientY: number }) => {
        const height =
          lastResponseHeight.current - clientY + lastClientY.current;
        lastClientY.current = clientY;
        lastResponseHeight.current = height < 0 ? 0 : height;
        if (gridContainerRef.current) {
          gridContainerRef.current.style.gridTemplateRows = `112px 1fr ${lastResponseHeight.current}px `;
        }
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", handleMove);
      });
    };
    document.addEventListener("mousedown", mousedown);
    return () => {
      document.removeEventListener("mousedown", mousedown);
    };
  }, []);
  return (
    <Grid
      h="full"
      ref={gridContainerRef as RefObject<HTMLDivElement>}
      templateRows={"112px calc(50% - 112px / 2) 1fr"}
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
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <InputRightAddon fontSize={"sm"} flex="1" w="auto">
            {api.data.path}
          </InputRightAddon>
          <Button ml="2" w="100px" colorScheme="blue" onClick={onSubmit}>
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
          {methodHasBody && (
            <Tab fontSize={"sm"} w={tabWidth}>
              Body
            </Tab>
          )}

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
        as={ValidatedForm}
        validator={validator}
        bg={bg}
        overflowY={"auto"}
      >
        {api.data.pathParams.length > 0 && (
          <TabPanel overflowY="auto">
            <ParamTable prefix="path" data={api.data.pathParams} />
          </TabPanel>
        )}
        {methodHasBody && (
          <TabPanel h="full" p={0}>
            {api.data.bodyType === "FORM" ? (
              <Box p={4} h="full" overflowY="auto">
                <ParamTable prefix="bodyForm" data={api.data.bodyForm} />
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
        )}
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
      <Box bg={useColorModeValue("gray.100", "gray.700")} position={"relative"}>
        <Box
          ref={responseDragRef as RefObject<HTMLDivElement>}
          position={"absolute"}
          top={"-10px"}
          left={0}
          right={0}
          role="group"
          py={"10px"}
          cursor={"ns-resize"}
          zIndex={100}
        >
          <Box
            _groupHover={{ opacity: 1 }}
            opacity={0}
            height={"1px"}
            width={"100%"}
            bgColor={"blue.500"}
          />
        </Box>
        <Box h={"full"} overflowY={"auto"}>
          {error ? (
            <ErrorEesponse err={error} />
          ) : response ? (
            <Response response={response} />
          ) : (
            <EmptyResponse />
          )}
        </Box>
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
                  name={`${prefix}[${i}].checked`}
                />
                {param.isRequired && (
                  <input type={"hidden"} name={`${prefix}[${i}].checked`} />
                )}
              </Td>
              <Td pl={0}>
                <FormControl isRequired={param.isRequired}>
                  <FormLabel fontSize={"sm"} m={0}>
                    <Text ml={3} as={"span"}>
                      {param.name}
                    </Text>
                    <input
                      type={"hidden"}
                      name={`${prefix}[${i}].name`}
                      value={param.name}
                    />
                  </FormLabel>
                </FormControl>
              </Td>
              <Td p={0}>
                <Input
                  borderWidth={0}
                  bg={bgBW}
                  size="sm"
                  name={`${prefix}[${i}].value`}
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
                <Checkbox
                  mr={2}
                  defaultChecked
                  name={`${prefix}_ext[${i}].checked`}
                />
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
              <Td p={0} pl={2}>
                <Button
                  variant={"ghost"}
                  size="sm"
                  onClick={() => removeId(id)}
                >
                  <Icon as={FiTrash2} />
                </Button>
              </Td>
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

const ErrorEesponse = ({ err }: { err: any }) => {
  let msg =
    (err instanceof AxiosError ? err.code : undefined) || "unkown error";

  return (
    <Center position={"relative"} h="full">
      <Text color="gray.400" p={4} position={"absolute"} top={0} left={0}>
        Response
      </Text>
      <VStack>
        <Icon color="red.300" as={FiAlertOctagon} w={20} h={20} />
        <br />
        <Text>Could not send request</Text>
        <Tag px={4} colorScheme={"red"}>
          Error: {msg}
        </Tag>
      </VStack>
    </Center>
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

const Response = ({ response }: { response: AxiosResponse }) => {
  let gray = useColorModeValue("gray.700", "gray.200");

  let contentType = (
    typeof response.headers.getContentType === "function"
      ? response.headers.getContentType() || ""
      : response.headers.getContentType || ""
  ).toString();

  let mode = contentType.startsWith("text/html")
    ? "html"
    : contentType.startsWith("application/json")
    ? "json"
    : "plain_text";

  return (
    <Tabs size={"sm"} h="full">
      <TabList px={2} as={HStack} gap={0}>
        <Tab fontSize={"sm"}>Body</Tab>
        <Tab fontSize={"sm"}>Headers</Tab>
        {/* TODO */}
        {/* <Tab fontSize={"xs"}>Cookies</Tab> */}
        <Spacer />
        <Box px={2}>
          <Text fontSize={"xs"} color={gray}>
            Status: {response.status} {response.statusText}
          </Text>
        </Box>
      </TabList>

      <TabPanels h="calc(100% - 33px)" overflowY={"auto"}>
        <TabPanel h="full" p={0}>
          {response.data ? (
            <AceEditor
              mode={mode}
              editorProps={{ $blockScrolling: true }}
              height="100%"
              width="100%"
              showGutter={true}
              showPrintMargin={false}
              value={response.data}
              tabSize={2}
              readOnly
            />
          ) : (
            <Center h="full">
              <Text color={"gray.400"}>No Data</Text>
            </Center>
          )}
        </TabPanel>
        <TabPanel>
          <TableContainer>
            <Table size={"sm"} variant="simple" colorScheme={"teal"}>
              <Thead>
                <Tr>
                  <Th width={"4%"}></Th>
                  <Th width={"48%"}>Key</Th>
                  <Th width={"48%"}>Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Object.entries(response.headers).map(([key, val], i) => (
                  <Tr key={i}>
                    <Td></Td>
                    <Td>{key}</Td>
                    <Td>{val}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </TabPanel>
        <TabPanel>
          <p>three!</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default Postman;
