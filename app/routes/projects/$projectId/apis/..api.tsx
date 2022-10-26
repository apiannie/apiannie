import {
  Box, BoxProps, Center, Flex,
  Grid, Heading, Icon,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue, useDisclosure,
} from "@chakra-ui/react";
import {
  ParamType, RequestBodyType,
  RequestParam,
} from "@prisma/client";
import { useLoaderData } from "@remix-run/react";
import React, { useEffect, useState } from "react";
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
  arrayElem: ResponseData;
}

type RequestBodyRaw = {
  description: string;
  example: string;
}

const Api = () => {
  const bg = useColorModeValue("gray.100", "gray.700");
  const fontColor = useColorModeValue("gray.600", "whiteAlpha.700");
  const labelWidth = "120px";
  const { api }: { [prop: string]: any } = useLoaderData<typeof loader>();
  let { text, color } = useMethodTag(api.data.method);
  const method = api.data.method;
  const requestHasBody =
    method === "POST" ||
    method === "DELETE" ||
    method === "PUT" ||
    method === "PATCH";
  return (
    <Box
      key={`${api.id}-${api.updatedAt}`}
      position={"relative"}
      p={2}
      pb={10}
    >
      <Header>General</Header>
      <Box bg={bg} p={4} borderRadius={5}>
        <Flex>
          <Text width={labelWidth}>Name:</Text>
          <Text color={fontColor}>{api.data.name}</Text>
        </Flex>
        <Flex mt={5}>
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
        <Flex mt={5}>
          <Text width={labelWidth}>Description:</Text>
          {api.data.description}
        </Flex>
      </Box>

      <Header mt={6}>Request</Header>
      {api.data.headers && api.data.headers.length > 0 && <Box bg={bg} p={4} borderRadius={5}>
          <Heading size={"sm"} mb={5}>Headers:</Heading>
          <ParamTable defaultValue={api.data.headers} /></Box>}
      {api.data.queryParams && api.data.queryParams.length > 0 && <Box mt={3} bg={bg} p={4} borderRadius={5}>
          <Heading size={"sm"} mb={5}>Query:</Heading>
          <ParamTable defaultValue={api.data.queryParams} />
      </Box>}
      {requestHasBody && <Box mt={3} bg={bg} p={4} borderRadius={5} minH={60}>
          <Heading size={"sm"} mb={5}>Body:</Heading>
          <BodyEditor
              type={api.data.bodyType}
              bodyJson={api.data.bodyJson}
              bodyForm={api.data.bodyForm}
              bodyRaw={api.data.bodyRaw}
          />
      </Box>}
      {!requestHasBody && !api.data.headers.length && !api.data.queryParams.length && <Box h={40} mt={3} bg={bg} p={4} borderRadius={5}></Box>}
      <Header mt={6}>Response</Header>
      <Box bg={bg} p={4} borderRadius={5} minH={40}>
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
      <Table variant="simple" colorScheme={"blackAlpha"}>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Is Required</Th>
            <Th>Type</Th>
            <Th>Example</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <Tbody>
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
      {isRoot && <Grid templateColumns={"1fr 120px 1fr 1fr 1fr"} py={3} w="full" {...rest} borderBottomWidth={1} borderColor={"blackAlpha"}>
          <Center flex="0 0 320px">
              <Text color={"gray.600"} fontWeight={"bold"}>NAME</Text>
          </Center>
          <Center>
              <Text color={"gray.600"} fontWeight={"bold"}>IS REQUIRED</Text>
          </Center>
          <Center>
              <Text color={"gray.600"} fontWeight={"bold"}>TYPE</Text>
          </Center>
          <Center>
              <Text color={"gray.600"} fontWeight={"bold"}>MOCK</Text>
          </Center>
          <Center>
              <Text color={"gray.600"} fontWeight={"bold"}>DESCRIPTION</Text>
          </Center>
      </Grid>}
      <Grid templateColumns={"1fr 120px 1fr 1fr 1fr"} py={3} hidden={hidden} w="full" {...rest} borderBottomWidth={1} borderColor={"blackAlpha"}>
        <Center pl={`${depth * 24}px`} flex="0 0 320px">
          <Center cursor="pointer" onClick={onToggle}>
            {defaultValues?.type === ParamType.OBJECT || defaultValues?.type === ParamType.ARRAY ? (
              <Icon
                fontSize={10}
                mr={2}
                as={isOpen ? BsFillCaretDownFill : BsFillCaretRightFill}
              />
            ) : undefined}
          </Center>
          <Text fontSize={"sm"}>{isRoot ? "Root" : isArrayElem ? "Items" : defaultValues?.name}</Text>
        </Center>
        <Center>
          <Text fontSize={"sm"}>{defaultValues?.isRequired ? "YES" : "NO"}</Text>
        </Center>
        <Center><Text fontSize={"sm"}>{defaultValues?.type.toLowerCase()}</Text></Center>
        <Center><Text fontSize={"sm"}>{isRoot || isArrayElem ? "Mock" : defaultValues?.mock}</Text></Center>
        <Center><Text fontSize={"sm"}>{defaultValues?.description}</Text></Center>
      </Grid>
      {defaultValues?.type === "ARRAY" && <JsonRow
          hidden={
            hidden || !isParentOpen || !isOpen
          }
          isParentOpen={isParentOpen && isOpen}
          depth={depth + 1}
          defaultValues={defaultValues.arrayElem}
      />}
      {defaultValues?.type === "OBJECT" && defaultValues?.children?.map((child, i) => (
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
    <Flex mb={2}>
      <Text width={120}>Content-Type:</Text>
      {type}
    </Flex>
    {type === "FORM" && <ParamTable defaultValue={bodyForm} />}
    {type === "JSON" && <JsonRow depth={0} isParentOpen={true} defaultValues={bodyJson} />}
    {type === "RAW" && <>
        <Flex mt={3}>
            <Text width={120}>Example:</Text>
          {bodyRaw?.example}
        </Flex>
        <Flex mt={3}>
            <Text width={120}>Description:</Text>
          {bodyRaw?.description}
        </Flex>
    </>}
  </>;
};

export default Api;
