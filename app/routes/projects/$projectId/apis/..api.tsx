import {
  Box,
  BoxProps,
  Center,
  Flex,
  Grid,
  Heading,
  Icon,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import {
  ParamType,
  RequestBodyRaw,
  RequestBodyType,
  RequestParam,
} from "@prisma/client";
import { useLoaderData, useParams } from "@remix-run/react";
import React, { useEffect, useState } from "react";
import { loader } from "./details.$apiId";
import { Header } from "~/ui";
import { useMethodTag } from "../apis";
import { BsFillCaretDownFill, BsFillCaretRightFill } from "react-icons/bs";
import { JsonNode } from "~/models/type";
import { methodContainsBody, parsePath, useUrl } from "~/utils";
import invariant from "tiny-invariant";

const Api = () => {
  let { projectId } = useParams();
  let url = useUrl();
  invariant(projectId);
  const bg = useColorModeValue("gray.100", "gray.700");
  const fontColor = useColorModeValue("gray.600", "whiteAlpha.700");
  const labelWidth = "120px";
  const { api } = useLoaderData<typeof loader>();
  let { text, color } = useMethodTag(api.data.method);
  const method = api.data.method;
  const requestHasBody = methodContainsBody(method);

  const bodyJson = api.data.bodyJson as JsonNode | null;
  const bodyRaw = api.data.bodyRaw as RequestBodyRaw | null;
  const response200 = (api.data.response as any)?.["200"] as JsonNode | null;

  const parsedPath = parsePath(api.data.path);
  const pathParams = parsedPath.params.map<RequestParam>((param) => {
    let elem = api.data.pathParams.find((obj) => obj.name === param);
    return {
      name: param,
      example: elem?.example || null,
      description: elem?.description || null,
      isRequired: elem?.isRequired || false,
      type: elem?.type || ParamType.STRING,
    };
  });
  return (
    <Box key={`${api.id}-${api.updatedAt}`} position={"relative"} p={2} pb={10}>
      <Header>General</Header>
      <Box p={4}>
        <Flex>
          <Text as="strong" width={labelWidth}>
            Name:
          </Text>
          <Text color={fontColor}>{api.data.name}</Text>
        </Flex>
        <Flex mt={5}>
          <Text as="strong" width={labelWidth}>
            Path:
          </Text>
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
        {pathParams.length > 0 && (
          <Flex mt={2}>
            <Text as="strong" width={labelWidth}>
              Params:
            </Text>
            <ParamTable
              flexGrow={1}
              size="sm"
              noPadding={true}
              defaultValue={pathParams}
            />
          </Flex>
        )}
        <Flex mt={5}>
          <Text as="strong" width={labelWidth}>
            Mock Server:
          </Text>
          <Link
            color={useColorModeValue("blue.700", "blue.200")}
            isExternal
            href={`/mock/${projectId}${api.data.path}`}
          >
            {`${url.origin}/mock/${projectId}${api.data.path}`}
          </Link>
        </Flex>
        {api.data.description && (
          <Flex mt={5}>
            <Text as="strong" width={labelWidth}>
              Description:
            </Text>
            {api.data.description}
          </Flex>
        )}
      </Box>

      <Header mt={12}>Request</Header>

      <Box p={4}>
        <Text as="strong" size={"sm"} mb={5}>
          Headers:
        </Text>
        {api.data.headers && api.data.headers.length > 0 ? (
          <ParamTable
            mt={1}
            borderWidth="1px"
            defaultValue={api.data.headers}
          />
        ) : (
          <Box mt={1} borderWidth={1} borderRadius={5} py={6}>
            <Text color="gray" textAlign={"center"}>
              No Data
            </Text>
          </Box>
        )}
      </Box>
      {api.data.queryParams && api.data.queryParams.length > 0 && (
        <Box mt={3} p={4}>
          <Text as={"strong"} size={"sm"} mb={5}>
            Query:
          </Text>
          <ParamTable
            mt={1}
            borderWidth="1px"
            defaultValue={api.data.queryParams}
          />
        </Box>
      )}
      {requestHasBody && (
        <Box mt={3} p={4}>
          <Text as="strong">Body ({api.data.bodyType}):</Text>
          <BodyEditor
            mt={1}
            type={api.data.bodyType}
            bodyJson={bodyJson || undefined}
            bodyForm={api.data.bodyForm}
            bodyRaw={bodyRaw || undefined}
            borderWidth="1px"
          />
        </Box>
      )}
      <Header mt={12}>Response</Header>
      <Box p={4}>
        <Box borderWidth={"1px"} p={4} borderRadius={5}>
          {response200 ? (
            <JsonRow
              depth={0}
              isParentOpen={true}
              defaultValues={response200 || undefined}
            />
          ) : (
            <Text color="gray" textAlign={"center"}>
              No Data
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const ParamTable = ({
  defaultValue,
  noPadding,
  size,
  ...rest
}: {
  defaultValue: RequestParam[];
  noPadding?: boolean;
  size?: string;
} & Omit<BoxProps, "defaultValue">) => {
  return (
    <TableContainer borderRadius={5} {...rest}>
      <Table size={size} variant="simple">
        <Thead>
          <Tr>
            <Th pl={noPadding ? 0 : undefined}>Name</Th>
            <Th>Required</Th>
            <Th>Type</Th>
            <Th>Example</Th>
            <Th pr={noPadding ? 0 : undefined}>Description</Th>
          </Tr>
        </Thead>

        <Tbody>
          {defaultValue.map((data, i) => (
            <Tr key={i}>
              <Td
                pl={noPadding ? 0 : undefined}
                borderBottomWidth={
                  i === defaultValue.length - 1 ? 0 : undefined
                }
              >
                {data?.name}
              </Td>
              <Td
                borderBottomWidth={
                  i === defaultValue.length - 1 ? 0 : undefined
                }
              >
                {data?.isRequired ? "YES" : "NO"}
              </Td>
              <Td
                borderBottomWidth={
                  i === defaultValue.length - 1 ? 0 : undefined
                }
              >
                {data?.type.toLowerCase()}
              </Td>
              <Td
                borderBottomWidth={
                  i === defaultValue.length - 1 ? 0 : undefined
                }
              >
                {data?.example}
              </Td>
              <Td
                pr={noPadding ? 0 : undefined}
                borderBottomWidth={
                  i === defaultValue.length - 1 ? 0 : undefined
                }
              >
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
  defaultValues?: JsonNode;
} & BoxProps) => {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
  });
  const isRoot = depth === 0;
  const headerColor = useColorModeValue("gray.600", "gray.400");
  return (
    <>
      {isRoot && (
        <Grid
          templateColumns={"1fr 120px 1fr 1fr 1fr"}
          py={3}
          w="full"
          {...rest}
          borderBottomWidth={1}
          fontSize={"xs"}
        >
          <Flex flex="0 0 320px">
            <Text color={headerColor} fontWeight={"bold"}>
              NAME
            </Text>
          </Flex>
          <Center>
            <Text color={headerColor} fontWeight={"bold"}>
              REQUIRED
            </Text>
          </Center>
          <Center>
            <Text color={headerColor} fontWeight={"bold"}>
              TYPE
            </Text>
          </Center>
          <Center>
            <Text color={headerColor} fontWeight={"bold"}>
              MOCK
            </Text>
          </Center>
          <Center>
            <Text color={headerColor} fontWeight={"bold"}>
              DESCRIPTION
            </Text>
          </Center>
        </Grid>
      )}
      <Grid
        templateColumns={"1fr 120px 1fr 1fr 1fr"}
        py={3}
        hidden={hidden}
        w="full"
        {...rest}
        borderBottomWidth={1}
        borderColor={"blackAlpha"}
      >
        <Flex pl={`${depth * 24}px`} flex="0 0 320px">
          <Center cursor="pointer" onClick={onToggle}>
            {defaultValues?.type === ParamType.OBJECT ||
            defaultValues?.type === ParamType.ARRAY ? (
              <Icon
                fontSize={10}
                mr={2}
                as={isOpen ? BsFillCaretDownFill : BsFillCaretRightFill}
              />
            ) : undefined}
          </Center>
          <Text fontSize={"sm"}>
            {isRoot ? "Root" : isArrayElem ? "Items" : defaultValues?.name}
          </Text>
        </Flex>
        <Center>
          <Text fontSize={"sm"}>
            {defaultValues?.isRequired ? "YES" : "NO"}
          </Text>
        </Center>
        <Center>
          <Text fontSize={"sm"}>{defaultValues?.type.toLowerCase()}</Text>
        </Center>
        <Center>
          <Text fontSize={"sm"}>
            {isRoot || isArrayElem ? "Mock" : defaultValues?.mock}
          </Text>
        </Center>
        <Center>
          <Text fontSize={"sm"}>{defaultValues?.description}</Text>
        </Center>
      </Grid>
      {defaultValues?.type === "ARRAY" && (
        <JsonRow
          hidden={hidden || !isParentOpen || !isOpen}
          isParentOpen={isParentOpen && isOpen}
          depth={depth + 1}
          defaultValues={defaultValues.arrayElem}
        />
      )}
      {defaultValues?.type === "OBJECT" &&
        defaultValues?.children?.map((child, i) => (
          <JsonRow
            key={i}
            keyId={i}
            hidden={hidden || !isParentOpen || !isOpen}
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
  ...rest
}: {
  bodyForm: RequestParam[];
  type: RequestBodyType;
  bodyJson?: JsonNode;
  bodyRaw?: RequestBodyRaw;
} & BoxProps) => {
  return (
    <Box {...rest}>
      {type === "FORM" &&
        (bodyForm.length > 0 ? (
          <ParamTable defaultValue={bodyForm} />
        ) : (
          <Box py={6}>
            <Text color="gray" textAlign={"center"}>
              No Data
            </Text>
          </Box>
        ))}
      {type === "JSON" && (
        <Box p={4}>
          <JsonRow depth={0} isParentOpen={true} defaultValues={bodyJson} />
        </Box>
      )}
      {type === "RAW" && (
        <>
          <Flex mt={3}>
            <Text width={120}>Example:</Text>
            {bodyRaw?.example}
          </Flex>
          <Flex mt={3}>
            <Text width={120}>Description:</Text>
            {bodyRaw?.description}
          </Flex>
        </>
      )}
    </Box>
  );
};

export default Api;
