import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  Heading,
  HeadingProps,
  HStack,
  Icon,
  Input,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
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
  useColorModeValue,
  useConst,
  useDisclosure,
  useMultiStyleConfig,
  useTab,
} from "@chakra-ui/react";
import { ParamType, RequestBodyType } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import React, { RefObject, useCallback, useRef, useState } from "react";
import { FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getApiById } from "~/models/api.server";
import { FormHInput, FormInput } from "~/ui";
import { httpResponse } from "~/utils";
import { PathInput } from "../apis";

export const loader = async ({ request, params }: LoaderArgs) => {
  let { apiId } = params;
  invariant(apiId);

  let api = await getApiById(apiId);

  if (!api) {
    throw httpResponse.NotFound;
  }

  return json({ api });
};

export const action = async ({ request }: ActionArgs) => {
  let formData = await request.formData();
  let result = await validator.validate(formData);

  if (result.error) {
    throw validationError(result.error);
  }

  return json({});
};

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

const zodParam = (additionalData?: { [key: string]: z.ZodTypeDef }) => {
  return z
    .object({
      name: z.string().trim(),
      example: z.string().trim(),
      description: z.string().trim(),
      isRequired: z.string(),
      ...additionalData,
    })
    .array()
    .optional();
};

const JsonNodeType = [
  ParamType.OBJECT,
  ParamType.ARRAY,
  ParamType.STRING,
  ParamType.FLOAT,
  ParamType.INT,
] as const;

interface JsonNode {
  name: string;
  example?: string;
  isRequired?: string;
  description?: string;
  type: Exclude<ParamType, "FILE">;
}

const JsonNode: z.ZodType<JsonNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    example: z.string().optional(),
    isRequired: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(JsonNodeType),
    children: z.array(JsonNode),
  })
);

const BodyTypes = [
  RequestBodyType.FORM,
  RequestBodyType.JSON,
  RequestBodyType.RAW,
] as const;

const validator = withZod(
  z.object({
    name: z.string().trim(),
    path: z.string().trim(),
    pathParams: zodParam(),
    queryParams: zodParam(),
    headers: zodParam(),
    bodyType: z.enum(BodyTypes),
    bodyForm: zodParam({ type: z.enum([ParamType.STRING, ParamType.FILE]) }),
    bodyJson: JsonNode,
    bodyRaw: z.object({
      example: z.string().trim(),
      description: z.string().trim(),
    }),
  })
);

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

const RadioTab = React.forwardRef<HTMLInputElement, RadioProps>(
  (props, ref) => {
    const bgBW = useColorModeValue("white", "inherit");
    const tabProps = useTab({ ...props, ref });
    const isSelected = !!tabProps["aria-selected"];
    const styles = useMultiStyleConfig("Tabs", tabProps);
    const { children, ...rest } = tabProps;
    return (
      <Box {...rest}>
        <Flex as="label">
          <Radio
            bg={bgBW}
            ref={ref}
            isChecked={isSelected}
            __css={styles.tab}
          />
          <Box ml={2}>{children}</Box>
        </Flex>
      </Box>
    );
  }
);

const Edit = () => {
  const bg = useColorModeValue("gray.100", "gray.700");
  const bgBW = useColorModeValue("white", "gray.900");
  const gray = useColorModeValue("gray.300", "gray.600");
  const labelWidth = "80px";
  const ref = useRef<HTMLFormElement>(null);

  return (
    <Box
      position={"relative"}
      as={ValidatedForm}
      method="patch"
      p={2}
      pb={10}
      validator={withZod(z.object({}))}
      formRef={ref}
      replace={true}
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
            />
          </Box>
        </Container>
      </Box>

      <Header mt={6}>Request</Header>
      <Box bg={bg} py={4}>
        <Tabs variant="solid-rounded" colorScheme="blue">
          <TabList display={"flex"} justifyContent="center">
            <Tab flexBasis={"100px"}>Query</Tab>
            <Tab flexBasis={"100px"}>Body</Tab>
            <Tab flexBasis={"100px"}>Headers</Tab>
          </TabList>
          <Divider my={2} borderColor={gray} />
          <TabPanels>
            <TabPanel>
              <ParamTable prefix="queryParams" />
            </TabPanel>
            <TabPanel>
              <Tabs>
                <RadioGroup px={4}>
                  <TabList border={"none"} display={"flex"} gap={4}>
                    <RadioTab>form-data</RadioTab>
                    <RadioTab>json</RadioTab>
                    <RadioTab>raw</RadioTab>
                  </TabList>
                </RadioGroup>
                <TabPanels mt={4}>
                  <TabPanel p={0}>
                    <ParamTable
                      prefix="bodyForm"
                      types={[ParamType.STRING, ParamType.FILE]}
                    />
                  </TabPanel>
                  <TabPanel>
                    <JsonEditor />
                  </TabPanel>
                  <TabPanel>
                    <Box>
                      <FormInput
                        bg={bgBW}
                        as={Textarea}
                        name="bodyRaw.example"
                        label="Example"
                        mb={6}
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
            </TabPanel>
            <TabPanel>
              <ParamTable prefix="headers" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      <Header mt={6}>Response</Header>
      <Button
        width={20}
        height={20}
        position={"fixed"}
        bottom={8}
        right={8}
        type="submit"
        colorScheme="blue"
        borderRadius={"full"}
      >
        Save
      </Button>
    </Box>
  );
};

const useIds = (initialValue?: number | null | undefined) => {
  let initial: number[] = [];
  let currentId = useRef(initialValue || 0);

  if (initialValue === null || initialValue === undefined) {
    // nothing to do
  } else if (Array.isArray(initialValue)) {
    initial = initialValue;
  } else {
    initial = Array<number>(initialValue)
      .fill(0)
      .map((_, i) => i + 1);
  }

  const [ids, setIds] = useState(initial);

  const pushId = useCallback(() => {
    setIds([...ids, ++currentId.current]);
  }, [ids]);

  const removeId = useCallback(
    (id: number) => {
      let value = ids.filter((current) => current !== id);
      if (value.length === 0) {
        value.push(++currentId.current);
      }
      setIds(value);
    },
    [ids]
  );

  return { ids, pushId, removeId };
};

const ParamTable = ({
  prefix,
  types,
}: {
  prefix: string;
  types?: string[];
}) => {
  const bgBW = useColorModeValue("white", "gray.900");
  const { ids, pushId, removeId } = useIds(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const descriptionRef = useRef<HTMLInputElement>(null);
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
        <Tbody>
          {ids.map((id, i) => (
            <Tr key={id}>
              <Td>
                <HStack>
                  <FormInput
                    id={`${prefix}-${id}-name`}
                    bg={bgBW}
                    size="sm"
                    name={`${prefix}[${i}].name`}
                  />
                  <Tooltip label="Required">
                    <Box>
                      <Checkbox
                        id={`${prefix}-${id}-required`}
                        bg={bgBW}
                        name={`${prefix}[${i}].isRequired`}
                        value="true"
                      />
                    </Box>
                  </Tooltip>
                </HStack>
              </Td>
              {types && (
                <Td>
                  <Select bg={bgBW} size="sm" name={`${prefix}[${i}].type`}>
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
                    ref={descriptionRef}
                  >
                    <InputRightElement h={8}>
                      <Button
                        onClick={onOpen}
                        size="xs"
                        colorScheme="teal"
                        variant={"ghost"}
                      >
                        <Icon as={FiEdit} />
                      </Button>
                    </InputRightElement>
                  </FormInput>
                  <Button size="sm" onClick={() => removeId(id)}>
                    <Icon as={FiTrash2} />
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <DiscriptionModal
        inputRef={descriptionRef}
        isOpen={isOpen}
        onClose={onClose}
      />
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

const DiscriptionModal = ({
  isOpen,
  onClose,
  inputRef,
}: Omit<ModalProps, "children"> & {
  inputRef: RefObject<HTMLInputElement>;
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Description</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Textarea
            ref={textAreaRef}
            defaultValue={inputRef.current?.value}
            rows={6}
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} mr={3}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={(e) => {
              if (inputRef.current && textAreaRef.current) {
                inputRef.current.value = textAreaRef.current.value;
              }
              onClose();
            }}
          >
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const JsonEditor = () => {
  return (
    <Box>
      <JsonRow />
    </Box>
  );
};

const JsonRow = () => {
  const types = [
    ParamType.OBJECT,
    ParamType.ARRAY,
    ParamType.STRING,
    ParamType.INT,
    ParamType.FLOAT,
    ParamType.BOOLEAN,
  ];
  return (
    <HStack>
      <FormInput flex="1.25 0.8 auto" size="sm" name="" placeholder="Name" />
      <Box height={4}>
        <Tooltip label="Required">
          <Box>
            <Checkbox />
          </Box>
        </Tooltip>
      </Box>
      <Select size="sm" flex="0 0 100px">
        {types.map((type) => (
          <option key={type} value={type}>
            {type.toLowerCase()}
          </option>
        ))}
      </Select>
      <FormInput size="sm" name="" placeholder="Example" />
      <FormInput flexGrow={30} size="sm" name="" placeholder="Description" />
    </HStack>
  );
};
