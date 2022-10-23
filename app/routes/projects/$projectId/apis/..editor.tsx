import {
  Box,
  BoxProps,
  Button,
  Center,
  Checkbox,
  Container,
  Divider,
  Flex,
  Heading,
  HeadingProps,
  HStack,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Radio,
  RadioGroup,
  RadioProps,
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
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBoolean,
  useColorModeValue,
  useDisclosure,
  useMultiStyleConfig,
  useTab,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  ApiData,
  ParamType,
  Prisma,
  RequestBodyType,
  RequestMethod,
  RequestParam,
} from "@prisma/client";
import { useLoaderData, useTransition } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BsFillCaretDownFill, BsFillCaretRightFill } from "react-icons/bs";
import { FiEye, FiMinus, FiPlus, FiSettings, FiTrash2 } from "react-icons/fi";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z, ZodTypeDef } from "zod";
import { saveApiData } from "~/models/api.server";
import { JsonNode, JsonNodeType, RequestMethods } from "~/models/type";
import { FormHInput, FormInput, FormSubmitButton, PathInput } from "~/ui";
import ModalInput from "~/ui/Form/ModalInput";
import { methodContainsBody, useDefault, useIds } from "~/utils";
import { loader } from "./details.$apiId";
import { Header } from "~/ui";

type JsonNodeFormElem = Omit<
  Partial<JsonNode>,
  "children" | "arrayElem" | "isRequired"
> & {
  isRequired?: string;
};
type JsonNodeForm = JsonNodeFormElem & {
  arrayElem?: JsonNodeForm;
  children?: JsonNodeForm[];
};
type JsonNodeTransformedElem = Omit<JsonNodeFormElem, "isRequired"> & {
  isRequired: boolean;
};
type JsonNodeTransformed = JsonNodeTransformedElem & {
  arrayElem?: JsonNodeTransformed;
  children?: JsonNodeTransformed[];
};

export const saveApiAction = async (apiId: string, formData: FormData) => {
  let result = await validator.validate(formData);

  if (result.error) {
    return validationError(result.error);
  }

  let data = result.data;

  let queryParams: RequestParam[] = formatZodParam(data.queryParams);
  let headers: RequestParam[] = formatZodParam(data.headers);
  let bodyForm: RequestParam[] = formatZodParam(data.bodyForm);
  let bodyJson = formatZodJson(data.bodyJson);
  let responseJson = formatZodJson(data.response);

  let apiData: ApiData = {
    name: data.name,
    path: data.path,
    method: data.method,
    description: data.description || null,
    pathParams: [],
    queryParams: queryParams,
    headers: headers,
    bodyType: data.bodyType,
    bodyForm: bodyForm,
    bodyRaw: {
      example: data.bodyRaw.example,
      description: data.bodyRaw.description,
    },
    bodyJson: bodyJson as unknown as Prisma.JsonValue,
    response: {
      "200": responseJson as unknown as Prisma.JsonValue,
    },
  };

  return saveApiData(apiId, apiData);
};

const JsonNodeZod: z.ZodType<
  JsonNodeTransformedElem,
  ZodTypeDef,
  JsonNodeFormElem
> = z.lazy(() =>
  z.object({
    name: z.string().optional(),
    mock: z.string().optional(),
    example: z.string().optional(),
    isRequired: z
      .string()
      .optional()
      .transform((elem) => elem !== undefined),
    description: z.string().optional(),
    type: z.enum(JsonNodeType),
    children: z.array(JsonNodeZod).optional(),
    arrayElem: JsonNodeZod.optional(),
  })
);

const BodyTypes = [
  RequestBodyType.FORM,
  RequestBodyType.JSON,
  RequestBodyType.RAW,
] as const;

const zodParam = z
  .object({
    name: z.string().trim().optional(),
    example: z.string().trim().optional(),
    description: z.string().trim().optional(),
    isRequired: z
      .string()
      .optional()
      .transform((arg) => arg !== undefined),
    type: z.nativeEnum(ParamType).optional(),
  })
  .array()
  .optional();

const formatZodParam = (params: z.infer<typeof zodParam>) => {
  return (params || [])
    .filter((obj) => !!obj.name)
    .map((obj) => {
      const { name, example, description, ...rest } = obj;
      invariant(name);
      return {
        name: name,
        example: example || "",
        description: description || "",
        type: obj.type || ParamType.STRING,
        ...rest,
      };
    });
};

const formatZodJson = (json: JsonNodeTransformed): JsonNode => {
  json.name = "root";
  const formatZodJsonRec = (node: JsonNodeTransformed) => {
    let { children, arrayElem, ...rest } = node;
    let { name, description, type, isRequired, mock, example } = rest;

    invariant(type);

    if (!name) {
      return undefined;
    }

    let newChildren: JsonNode[] =
      children
        ?.map((elem) => formatZodJsonRec(elem))
        .filter((elem): elem is JsonNode => !!elem) || [];

    let newArrayElem = arrayElem ? formatZodJsonRec(arrayElem) : undefined;

    let retval: JsonNode = {
      name: name,
      type: type,
      description: description || "",
      example: example || "",
      mock: mock || "",
      isRequired: !!isRequired,
      children: newChildren,
      arrayElem: newArrayElem,
    };
    return retval;
  };

  return formatZodJsonRec(json) as JsonNode;
};

const validator = withZod(
  z.object({
    name: z.string().trim(),
    path: z.string().trim(),
    method: z.enum(RequestMethods),
    description: z.string().trim().optional(),
    pathParams: zodParam,
    queryParams: zodParam,
    headers: zodParam,
    bodyType: z.enum(BodyTypes),
    bodyForm: zodParam,
    bodyJson: JsonNodeZod,
    bodyRaw: z.object({
      example: z.string().trim(),
      description: z.string().trim(),
    }),
    response: JsonNodeZod,
  })
);

const RadioTab = React.forwardRef<HTMLInputElement, RadioProps>(
  (props, ref) => {
    const bgBW = useColorModeValue("white", "inherit");
    const tabProps = useTab({ ...props, ref });
    const isSelected = !!tabProps["aria-selected"];
    const styles = useMultiStyleConfig("Tabs", tabProps);
    const { children, ...rest } = tabProps;
    const { name, value, defaultChecked } = props;
    return (
      <Box {...rest}>
        <Flex as="label">
          <Radio
            bg={bgBW}
            ref={ref}
            isChecked={isSelected}
            __css={styles.tab}
            name={name}
            value={value}
            defaultChecked={defaultChecked}
          />
          <Box ml={2}>{children}</Box>
        </Flex>
      </Box>
    );
  }
);

const jsonNodeToForm = (json: JsonNode) => {
  const { type, children, arrayElem, isRequired, ...rest } = json;
  const newChildren = children.map((elem) => jsonNodeToForm(elem));
  const newArrayElem = arrayElem ? jsonNodeToForm(arrayElem) : undefined;
  let retval: JsonNodeForm = {
    type: type,
    children: type === "ARRAY" ? [] : newChildren,
    arrayElem: newArrayElem,
    isRequired: isRequired ? "true" : undefined,
    ...rest,
  };
  return retval;
};

const Editor = () => {
  const bg = useColorModeValue("gray.100", "gray.700");
  const bgBW = useColorModeValue("white", "gray.900");
  const gray = useColorModeValue("gray.300", "gray.600");
  const labelWidth = "100px";
  const ref = useRef<HTMLFormElement>(null);
  const { api } = useLoaderData<typeof loader>();
  let { response, bodyJson, ...rest } = api.data;
  let response200 = response ? (response as any)["200"] : undefined;

  const [method, setMethod] = useState(api.data.method);
  const [bodyTabIndex, setBodyTabIndex] = useState(0);

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

  let defaultValues = {
    ...rest,
    response: response200
      ? jsonNodeToForm(response200 as unknown as JsonNode)
      : undefined,
    bodyJson: bodyJson
      ? jsonNodeToForm(bodyJson as unknown as JsonNode)
      : undefined,
  };

  const onMethodChange: React.ChangeEventHandler<HTMLSelectElement> =
    useCallback(
      function (e) {
        setMethod(e.target.value as RequestMethod);
      },
      [method]
    );

  const transition = useTransition();
  const toast = useToast();

  useEffect(() => {
    if (transition.state === "loading") {
      let action = transition.submission?.formData?.get("_action");
      if (action === "saveApi") {
        toast({
          title: "Your change has been saved.",
          status: "success",
          position: "top",
          isClosable: true,
        });
      }
    }
  }, [transition.state]);

  return (
    <Box
      key={`${api.id}-${api.updatedAt}`}
      position={"relative"}
      as={ValidatedForm}
      method="patch"
      p={2}
      pb={10}
      validator={withZod(z.object({}))}
      formRef={ref}
      replace={true}
      resetAfterSubmit
    >
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
              as={Input}
              autoComplete="off"
              defaultValue={defaultValues.name}
            />
          </Box>
          <Box py={2}>
            <FormHInput
              isRequired
              bg={bgBW}
              labelWidth={labelWidth}
              name="path"
              label="Path"
              as={PathInput}
              autoComplete="off"
              size="sm"
              method={method}
              onMethodChange={onMethodChange}
              defaultValue={defaultValues.path}
            />
          </Box>
          <Box py={2}>
            <FormHInput
              bg={bgBW}
              labelWidth={labelWidth}
              name="description"
              label="Description"
              as={Textarea}
              autoComplete="off"
              size="sm"
              rows={5}
              defaultValue={defaultValues.description || ""}
            />
          </Box>
        </Container>
      </Box>

      <Header mt={6}>Request</Header>
      <Box bg={bg} py={4}>
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
                type={defaultValues.bodyType}
                bodyJson={defaultValues.bodyJson}
                bodyForm={defaultValues.bodyForm}
              />
            </TabPanel>
            <TabPanel>
              <ParamTable
                defaultValue={defaultValues.queryParams}
                prefix="queryParams"
              />
            </TabPanel>
            <TabPanel>
              <ParamTable
                defaultValue={defaultValues.headers}
                prefix="headers"
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      <Header mt={6}>Response</Header>
      <Box bg={bg} p={8}>
        <JsonEditor
          prefix="response"
          isMock={true}
          defaultValues={defaultValues.response}
        />
      </Box>
      <Center mt={12}>
        <FormSubmitButton
          name="_action"
          value="saveApi"
          w="240px"
          type="submit"
          colorScheme="blue"
        >
          Save
        </FormSubmitButton>
      </Center>
    </Box>
  );
};

const BodyEditor = ({
  type,
  bodyJson,
  bodyForm,
}: {
  bodyForm: RequestParam[];
  type: RequestBodyType;
  bodyJson?: JsonNodeForm;
}) => {
  const bgBW = useColorModeValue("white", "gray.900");

  return (
    <Tabs>
      <RadioGroup px={4} defaultValue={type}>
        <TabList border={"none"} display={"flex"} gap={4}>
          <RadioTab name="bodyType" value={RequestBodyType.FORM}>
            form-data
          </RadioTab>
          <RadioTab name="bodyType" value={RequestBodyType.JSON}>
            json
          </RadioTab>
          <RadioTab name="bodyType" value={RequestBodyType.RAW}>
            raw
          </RadioTab>
        </TabList>
      </RadioGroup>
      <TabPanels mt={4}>
        <TabPanel p={0}>
          <ParamTable
            defaultValue={bodyForm}
            prefix="bodyForm"
            types={[ParamType.STRING, ParamType.FILE]}
          />
        </TabPanel>
        <TabPanel>
          <JsonEditor
            defaultValues={bodyJson}
            prefix="bodyJson"
            isMock={false}
          />
        </TabPanel>
        <TabPanel>
          <Box>
            <FormInput
              bg={bgBW}
              as={Textarea}
              name="bodyRaw.example"
              label="Example"
              container={{
                mb: 6,
              }}
            />
            <FormInput
              bg={bgBW}
              as={Textarea}
              name="bodyRaw.description"
              label="Description"
            />
          </Box>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

const ParamTable = ({
  prefix,
  types,
  defaultValue,
}: {
  prefix: string;
  types?: string[];
  defaultValue: RequestParam[];
}) => {
  const bgBW = useColorModeValue("white", "gray.900");
  const { ids, pushId, removeId } = useIds(Math.max(defaultValue.length, 1), 1);
  return (
    <TableContainer>
      <Table size={"sm"} colorScheme="teal">
        <Thead>
          <Tr>
            <Th width={"20%"}>Name</Th>
            {types && <Th>Type</Th>}
            <Th width={"25%"}>Example</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <Tbody verticalAlign={"baseline"}>
          {ids.map((id, i) => (
            <Tr key={id}>
              <Td>
                <HStack alignItems={"flex-start"}>
                  <FormInput
                    id={`${prefix}-${id}-name`}
                    bg={bgBW}
                    size="sm"
                    name={`${prefix}[${i}].name`}
                    defaultValue={defaultValue[id]?.name}
                  />
                  <Tooltip label="Required">
                    <Center h={8}>
                      <FormInput
                        as={Checkbox}
                        id={`${prefix}-${id}-required`}
                        bg={bgBW}
                        name={`${prefix}[${i}].isRequired`}
                        defaultChecked={defaultValue[id]?.isRequired}
                      />
                    </Center>
                  </Tooltip>
                </HStack>
              </Td>
              {types && (
                <Td>
                  <Select
                    bg={bgBW}
                    size="sm"
                    name={`${prefix}[${i}].type`}
                    defaultValue={defaultValue[id]?.type}
                  >
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type.toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </Td>
              )}
              <Td>
                <FormInput
                  id={`${prefix}-${id}-example`}
                  bg={bgBW}
                  size="sm"
                  name={`${prefix}[${i}].example`}
                />
              </Td>
              <Td>
                <HStack>
                  <FormInput
                    id={`${prefix}-${id}-description`}
                    bg={bgBW}
                    size="sm"
                    name={`${prefix}[${i}].description`}
                    as={ModalInput}
                    modal={{ title: "Description" }}
                    defaultValue={defaultValue[id]?.description || ""}
                  />
                  <Button size="sm" onClick={() => removeId(id)}>
                    <Icon as={FiTrash2} />
                  </Button>
                </HStack>
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

const JsonEditor = ({
  prefix,
  isMock,
  defaultValues,
}: {
  prefix: string;
  isMock: boolean;
  defaultValues?: JsonNodeForm;
}) => {
  return (
    <Box>
      <VStack>
        <JsonRow
          depth={0}
          isParentOpen={true}
          prefix={prefix}
          isMock={isMock}
          defaultValues={defaultValues}
        />
      </VStack>
      <Center mt={8}>
        <Button colorScheme={"blue"} variant="outline" size="sm">
          <Icon as={FiEye} />
          <Text ml={2}>View Example</Text>
        </Button>
      </Center>
    </Box>
  );
};

const JsonRow = ({
  depth,
  isParentOpen,
  isArrayElem,
  keyId,
  onAddSibling,
  onDelete,
  prefix,
  isMock,
  defaultValues,
  hidden,
  ...rest
}: {
  depth: number;
  isParentOpen?: boolean;
  isArrayElem?: boolean;
  onAddSibling?: (id: number) => void;
  onDelete?: (id: number) => void;
  prefix: string;
  keyId?: number;
  isMock: boolean;
  defaultValues?: JsonNodeForm;
} & BoxProps) => {
  const types = [
    ParamType.OBJECT,
    ParamType.ARRAY,
    ParamType.STRING,
    ParamType.INT,
    ParamType.FLOAT,
    ParamType.BOOLEAN,
  ];
  const bgBW = useColorModeValue("white", "gray.900");
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
  });
  const isRoot = depth === 0;
  const [type, setType] = useState<ParamType>(
    defaultValues?.type || (isRoot ? ParamType.OBJECT : ParamType.STRING)
  );
  const [touched, setTouched] = useBoolean(isRoot || !!defaultValues?.name);
  const { ids, pushId, removeId, insertAfterId } = useIds(
    defaultValues?.children?.length || 1,
    1
  );
  const blue = useColorModeValue("blue.500", "blue.200");

  return (
    <>
      <HStack hidden={hidden} w="full" {...rest} alignItems="flex-start">
        <Center pl={`${depth * 24}px`} flex="0 0 320px">
          <Center w={4} h={4} cursor="pointer" onClick={onToggle}>
            {type === ParamType.OBJECT || type === ParamType.ARRAY ? (
              <Icon
                fontSize={10}
                as={isOpen ? BsFillCaretDownFill : BsFillCaretRightFill}
              />
            ) : undefined}
          </Center>
          <FormInput
            minW={16}
            size="sm"
            name={`${prefix}.name`}
            placeholder="Name"
            bg={bgBW}
            isDisabled={isRoot || isArrayElem}
            value={isRoot ? "root" : isArrayElem ? "items" : undefined}
          />
        </Center>
        <Box>
          <Tooltip label="Required">
            <Center h={8}>
              <FormInput
                as={Checkbox}
                name={`${prefix}.isRequired`}
                bg={bgBW}
                isChecked={isArrayElem ? false : undefined}
                isDisabled={isArrayElem}
                // value="true"
              />
            </Center>
          </Tooltip>
        </Box>
        <Select
          onChange={(e) => {
            setTouched.on();
            setType(e.target.value as ParamType);
          }}
          bg={bgBW}
          size="sm"
          flex="0 0 100px"
          defaultValue={type}
          name={`${prefix}.type`}
        >
          {types.map((type) => (
            <option key={type} value={type}>
              {type.toLowerCase()}
            </option>
          ))}
        </Select>
        <FormInput
          bg={bgBW}
          size="sm"
          name={`${prefix}.${isMock ? "mock" : "example"}`}
          placeholder={isMock ? "Mock" : "Example"}
          as={ModalInput}
          modal={{ title: "Mock" }}
          isDisabled={type === "ARRAY" || type === "OBJECT"}
        />
        <FormInput
          bg={bgBW}
          size="sm"
          name={`${prefix}.description`}
          placeholder="Description"
          as={ModalInput}
          modal={{ title: "Description" }}
        />
        {isArrayElem ? (
          <Box flexBasis={"64px"} flexShrink={0} flexGrow={0} />
        ) : (
          <Flex flexBasis={"64px"} flexShrink={0} flexGrow={0}>
            {isRoot ? (
              <Button p={0} size="sm" colorScheme={"green"} variant="ghost">
                <Icon as={FiSettings} />
              </Button>
            ) : (
              <Button
                p={0}
                size="sm"
                colorScheme={"red"}
                variant="ghost"
                onClick={(e) => onDelete?.(keyId as number)}
              >
                <Icon as={FiMinus} />
              </Button>
            )}
            {depth === 0 || type !== ParamType.OBJECT ? (
              <Button
                p={0}
                size="sm"
                colorScheme={"blue"}
                variant="ghost"
                onClick={(e) => {
                  if (depth === 0) {
                    pushId();
                  } else {
                    onAddSibling?.(keyId as number);
                  }
                }}
              >
                <Icon as={FiPlus} />
              </Button>
            ) : (
              <Menu size={"sm"} colorScheme={"blue"}>
                <MenuButton
                  p={0}
                  as={IconButton}
                  icon={<FiPlus />}
                  colorScheme="blue"
                  size="sm"
                  variant={"ghost"}
                />
                <MenuList zIndex={5}>
                  <MenuItem onClick={pushId}>Add child node</MenuItem>
                  <MenuItem onClick={(e) => onAddSibling?.(keyId as number)}>
                    Add sibling node
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </Flex>
        )}
      </HStack>
      {touched && (
        <JsonRow
          isParentOpen={isParentOpen && isOpen}
          depth={depth + 1}
          hidden={
            hidden || !isParentOpen || !isOpen || type !== ParamType.ARRAY
          }
          isArrayElem
          onAddSibling={insertAfterId}
          onDelete={removeId}
          prefix={`${prefix}.arrayElem`}
          isMock={isMock}
          defaultValues={defaultValues?.arrayElem}
        />
      )}
      {touched &&
        ids.map((id, i) => (
          <JsonRow
            key={id}
            keyId={id}
            isParentOpen={isParentOpen && isOpen}
            depth={depth + 1}
            hidden={
              hidden || !isParentOpen || !isOpen || type !== ParamType.OBJECT
            }
            onAddSibling={insertAfterId}
            onDelete={removeId}
            prefix={`${prefix}.children[${i}]`}
            isMock={isMock}
            defaultValues={defaultValues?.children?.[i]}
          />
        ))}
    </>
  );
};

export default Editor;
