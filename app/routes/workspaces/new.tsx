import {
  Flex,
  Heading,
  Stack,
  useColorModeValue,
  Text,
  Box,
  Link,
  Image,
} from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";
import { ValidatedForm } from "remix-validated-form";
import FormInput from "~/ui/Form/FormInput";
import FormSubmitButton from "~/ui/Form/FormSubmitButton";
import { useUser } from "~/utils";
import logo from "~/images/logo.png";
import {
  newWorkspaceAction,
  newWorkspaceValidator as validator,
} from "../workspaces.parts/NewWorkspaceModal";
import { Action } from "../workspaces.parts/constants";
import { ActionArgs } from "@remix-run/node";
import { requireUser } from "~/session.server";

export const action = async ({ request, params }: ActionArgs) => {
  let user = await requireUser(request);
  let formData = await request.formData();
  return newWorkspaceAction({ formData, user });
};

const NewWorkspaceLanding = () => {
  const user = useUser();
  return (
    <Flex minH={"100vh"} bg={useColorModeValue("gray.50", "gray.800")}>
      <Stack spacing={8} mx={"auto"} width="480px" maxW={"lg"} py={20} px={6}>
        <RemixLink to="/home">
          <Image src={logo} height="36px" width={"fit-content"} mx="auto" />
        </RemixLink>
        <Stack align={"center"}>
          <Heading fontSize={"4xl"}>Create Workspace</Heading>
          <Text textAlign="center" fontSize={"lg"} color={"gray.600"}>
            Welcome <b>{user.name}</b>, create your first workspace
            <br />
            to continue
          </Text>
        </Stack>
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          p={8}
        >
          <ValidatedForm validator={validator} method="post">
            <Stack spacing={4}>
              <FormInput name="name" placeholder="Workspace name" />
              <FormSubmitButton
                type="submit"
                colorScheme="teal"
                value={Action.NEW_WORKSPACE}
              >
                Create
              </FormSubmitButton>
            </Stack>
          </ValidatedForm>
        </Box>

        <Stack pt={6}>
          <Text align={"center"}>
            <Link as={RemixLink} to="/home/logout" color={"blue.400"}>
              Logout
            </Link>
          </Text>
        </Stack>
      </Stack>
    </Flex>
  );
};

export default NewWorkspaceLanding;
