import {
  Box, BoxProps, Center, Checkbox,
  Divider, Flex,
  Grid, Heading, HStack, Icon, Input,
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
  Thead, Tooltip,
  Tr,
  useColorModeValue, useDisclosure,
} from "@chakra-ui/react";
import {
  ParamType, RequestBodyType,
  RequestParam,
} from "@prisma/client";
import { useLoaderData } from "@remix-run/react";
import React, { RefObject, useEffect, useRef, useState } from "react";
import { loader } from "./details.$apiId";
import { Header } from "~/ui";
import { useMethodTag } from "../apis";
import { BsFillCaretDownFill, BsFillCaretRightFill } from "react-icons/bs";

type ResponseData = {
  name: string;
  type: string;
  description: string;
  example: string;
  mock: string;
  isRequired: boolean;
  children: Array<ResponseData>;
}

type RequestBodyRaw = {
  description: string;
  example: string;
}

const Api = () => {
  const bg = useColorModeValue("gray.100", "gray.700");
  const fontColor = useColorModeValue("gray.600", "whiteAlpha.700");
  const gray = useColorModeValue("gray.300", "gray.600");
  const labelWidth = "120px";
  const { api }: { [prop: string]: any } = useLoaderData<typeof loader>();
  let { text, color } = useMethodTag(api.data.method);
  const [bodyTabIndex, setBodyTabIndex] = useState(0);
  const method = api.data.method;
  const requestHasBody =
    method === "POST" ||
    method === "DELETE" ||
    method === "PUT" ||
    method === "PATCH";

  useEffect(() => {
    if (!requestHasBody) {
      setBodyTabIndex(1);
    }
  }, [requestHasBody]);
  return (
    <Box
      key={`${api.id}-${api.updatedAt}`}
      position={"relative"}
      p={2}
      pb={10}
    >
      <Header>General</Header>
      <Box bg={bg} p={4} borderRadius={5}>
        <Grid templateColumns="repeat(2, 1fr)" gap={6} maxW="container.lg">
          <Flex>
            <Text width={labelWidth}>Name:</Text>
            <Text color={fontColor}>{api.data.name}</Text>
          </Flex>
          <Flex>
            <Text width={labelWidth}>Path:</Text>
            <Flex color={fontColor}>
              <Box
                fontWeight={700}
                bg={color}
                px={2}
                mr={3}
                borderRadius={3}
                color={"white"}
                flexBasis="40px"
              >
                {text}
              </Box>
              {api.data.path}
            </Flex>
          </Flex>
        </Grid>
        <Flex mt={5}>
          <Text width={labelWidth}>Description:</Text>
          <Textarea color={fontColor} lineHeight={"24px"} py={0} readOnly={true} defaultValue={api.data.description ?? ""}></Textarea>
        </Flex>
      </Box>

      <Header mt={6}>Request</Header>
      <Box bg={bg} p={4} borderRadius={5}>
        <Tabs
          index={bodyTabIndex}
          onChange={setBodyTabIndex}
          variant="solid-rounded"
          colorScheme="cyan"
        >
          <TabList display={"flex"} justifyContent="center">
            <Tab hidden={!requestHasBody} flexBasis={"100px"}>
              Body
            </Tab>
            <Tab flexBasis={"100px"}>Query</Tab>
            <Tab flexBasis={"100px"}>Headers</Tab>
          </TabList>
          <Divider my={2} borderColor={gray} />
          <TabPanels>
            <TabPanel>
              <BodyEditor
                type={api.data.bodyType}
                bodyJson={api.data.bodyJson}
                bodyForm={api.data.bodyForm}
                bodyRaw={api.data.bodyRaw}
              />
            </TabPanel>
            <TabPanel>
              <ParamTable
                defaultValue={api.data.queryParams}
              />
            </TabPanel>
            <TabPanel>
              <ParamTable
                defaultValue={api.data.headers}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      <Header mt={6}>Response</Header>
      <Box bg={bg} p={4} borderRadius={5}>
        {api.data.response && <JsonRow
            depth={0}
            isParentOpen={true}
            defaultValues={api.data.response["200"]}
        />}
      </Box>
    </Box>
  );
};

const ParamTable = ({
  defaultValue,
}: {
  defaultValue: RequestParam[];
}) => {
  return (
    <TableContainer>
      <Table size={"sm"} colorScheme="teal">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Is Required</Th>
            <Th>Type</Th>
            <Th>Example</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <Tbody verticalAlign={"baseline"}>
          {defaultValue.map((data, i) => (
            <Tr key={i}>
              <Td>
                {data?.name}
              </Td>
              <Td>
                {data?.isRequired ? "YES" : "NO"}
              </Td>
              <Td>
                {data?.type.toLowerCase()}
              </Td>
              <Td>
                {data?.example}
              </Td>
              <Td>
                {data?.description}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const JsonRow = ({
  depth,
  isParentOpen,
  isArrayElem,
  keyId,
  defaultValues,
  hidden,
  ...rest
}: {
  depth: number;
  isParentOpen?: boolean;
  isArrayElem?: boolean;
  keyId?: number;
  defaultValues?: ResponseData;
} & BoxProps) => {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
  });
  const isRoot = depth === 0;
  return (
    <>
      <HStack hidden={hidden} mb={3} w="full" {...rest} alignItems="flex-start">
        <Center pl={`${depth * 24}px`} flex="0 0 320px">
          <Center w={4} h={4} cursor="pointer" onClick={onToggle}>
            {defaultValues?.type === ParamType.OBJECT || defaultValues?.type === ParamType.ARRAY ? (
              <Icon
                fontSize={10}
                as={isOpen ? BsFillCaretDownFill : BsFillCaretRightFill}
              />
            ) : undefined}
          </Center>
          <Input readOnly={true} defaultValue={isRoot ? "root" : isArrayElem ? "items" : defaultValues?.name} />
        </Center>
        <Box>
          <Tooltip label="Required">
            <Center h={8}>
              <Checkbox readOnly={true} defaultChecked={!!defaultValues?.isRequired} />
            </Center>
          </Tooltip>
        </Box>
        <Input readOnly={true} defaultValue={defaultValues?.type.toLowerCase()} />
        <Input readOnly={true} placeholder={"Mock"} disabled={isRoot || isArrayElem} defaultValue={isRoot || isArrayElem ? "Mock" : defaultValues?.mock} />
        <Input readOnly={true} placeholder={"Description"} defaultValue={defaultValues?.description} />
      </HStack>
      {defaultValues?.children.map((child, i) => (
        <JsonRow
          key={i}
          keyId={i}
          hidden={
            hidden || !isParentOpen || !isOpen
          }
          isParentOpen={isParentOpen && isOpen}
          depth={depth + 1}
          defaultValues={child}
        />
      ))}
    </>
  );
};

const BodyEditor = ({
  type,
  bodyJson,
  bodyForm,
  bodyRaw,
}: {
  bodyForm: RequestParam[];
  type: RequestBodyType;
  bodyJson?: ResponseData;
  bodyRaw?: RequestBodyRaw
}) => {
  return <>
    <Heading size={"sm"} mb={5}>{type}</Heading>
    {type === "FORM" && <ParamTable defaultValue={bodyForm} />}
    {type === "JSON" && <JsonRow depth={0} isParentOpen={true} defaultValues={bodyJson} />}
    {type === "RAW" && <>
        <Flex>
            <Text width={120}>Example:</Text>
            <Textarea readOnly={true}  defaultValue={bodyRaw?.example} />
        </Flex>
        <Flex mt={5}>
            <Text width={120}>Description:</Text>
            <Textarea readOnly={true} defaultValue={bodyRaw?.description} />
        </Flex>
    </>}
  </>;
  // <Tabs>
  //   {/*<RadioGroup px={4} defaultValue={type}>*/}
  //   {/*  <TabList border={"none"} display={"flex"} gap={4}>*/}
  //   {/*    <RadioTab name="bodyType" value={RequestBodyType.FORM}>*/}
  //   {/*      form-data*/}
  //   {/*    </RadioTab>*/}
  //   {/*    <RadioTab name="bodyType" value={RequestBodyType.JSON}>*/}
  //   {/*      json*/}
  //   {/*    </RadioTab>*/}
  //   {/*    <RadioTab name="bodyType" value={RequestBodyType.RAW}>*/}
  //   {/*      raw*/}
  //   {/*    </RadioTab>*/}
  //   {/*  </TabList>*/}
  //   {/*</RadioGroup>*/}
  //
  //   <TabPanels mt={4}>
  //     <TabPanel p={0}>
  //       <ParamTable
  //         defaultValue={bodyForm}
  //       />
  //     </TabPanel>
  //     <TabPanel>
  //       <JsonRow depth={0}  isParentOpen={true} defaultValues={bodyJson} />
  //     </TabPanel>
  //     <TabPanel>
  //       {/*<Box>*/}
  //       {/*  <FormInput*/}
  //       {/*    bg={bgBW}*/}
  //       {/*    as={Textarea}*/}
  //       {/*    name="bodyRaw.example"*/}
  //       {/*    label="Example"*/}
  //       {/*    container={{*/}
  //       {/*      mb: 6,*/}
  //       {/*    }}*/}
  //       {/*  />*/}
  //       {/*  <FormInput*/}
  //       {/*    bg={bgBW}*/}
  //       {/*    as={Textarea}*/}
  //       {/*    name="bodyRaw.description"*/}
  //       {/*    label="Description"*/}
  //       {/*  />*/}
  //       {/*</Box>*/}
  //     </TabPanel>
  //   </TabPanels>
  // </Tabs>
};

export default Api;
