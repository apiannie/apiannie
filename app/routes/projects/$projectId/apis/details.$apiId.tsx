import {
  Box,
  Button,
  Checkbox,
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
import { ActionArgs, json } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm } from "remix-validated-form";
import { z } from "zod";
import { FormHInput } from "~/ui";
import { PathInput } from "../apis";

export const action = async ({ request }: ActionArgs) => {
  let formData = await request.formData();
  let result = await validator.validate(formData);

  console.log(result.error);
  console.log(result.data);

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

const validator = withZod(
  z.object({
    name: z.string().trim(),
    path: z.string().trim(),
    pathParams: z
      .object({
        name: z.string().trim(),
        example: z.string().trim(),
        description: z.string().trim(),
      })
      .array(),
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

const Edit = () => {
  const bg = useColorModeValue("gray.100", "gray.700");
  const bgBW = useColorModeValue("white", "gray.900");
  const gray = useColorModeValue("gray.300", "gray.600");
  const labelWidth = "80px";
  return (
    <Box as={ValidatedForm} method="patch" p={2} validator={validator}>
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
              <Container maxW="container.lg"></Container>
            </TabPanel>
            <TabPanel>
              <Container maxW="container.lg">
                <QueryTable />
              </Container>
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

      <Button type="submit" colorScheme="blue">
        Save
      </Button>
    </Box>
  );
};

const QueryTable = () => {
  const bgBW = useColorModeValue("white", "gray.900");

  return (
    <TableContainer>
      <Table colorScheme="teal">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Required</Th>
            <Th>Example</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <Tbody bg={bgBW}>
          <Tr>
            <Td>
              <Input name="pathParams[0].name" />
            </Td>
            <Td>
              <Checkbox name="pathParams[0].isRequired" />{" "}
            </Td>
            <Td>
              <Input name="pathParams[0].example" />
            </Td>
            <Td>
              <Input name="pathParams[0].description" />
            </Td>
          </Tr>
          <Tr>
            <Td>
              <Input name="pathParams[1].name" />
            </Td>
            <Td>
              <Checkbox name="pathParams[1].isRequired" />{" "}
            </Td>
            <Td>
              <Input name="pathParams[1].example" />
            </Td>
            <Td>
              <Input name="pathParams[1].description" />
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </TableContainer>
  );
};
