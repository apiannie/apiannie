import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/workspaces");
  return json({});
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm-password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  const errors = {
    name: null,
    email: null,
    password: null,
    confirmPassword: null,
  };

  if (typeof name !== "string" || name.length === 0) {
    return json(
      { errors: { ...errors, name: "Name name is required" } },
      { status: 400 }
    );
  }

  if (!validateEmail(email)) {
    return json(
      { errors: { ...errors, email: "Email is invalid" } },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      { errors: { ...errors, password: "Password is required" } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      { errors: { ...errors, password: "Password is too short" } },
      { status: 400 }
    );
  }

  if (typeof confirmPassword !== "string" || confirmPassword.length === 0) {
    return json(
      {
        errors: { ...errors, confirmPassword: "Confirm password is required" },
      },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return json(
      {
        errors: { ...errors, confirmPassword: "Password does not match" },
      },
      { status: 400 }
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json(
      {
        errors: {
          ...errors,
          email: "A user already exists with this email",
        },
      },
      { status: 400 }
    );
  }

  const user = await createUser(email, password, name);

  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo,
  });
}

export default function SignUp() {
  const actionData = useActionData<typeof action>();

  return (
    <Flex
      minH={"100vh"}
      justify={"center"}
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      <Stack width="440px" spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
        <Stack align={"center"}>
          <Heading fontSize={"4xl"} textAlign={"center"}>
            Sign up
          </Heading>
          <Text fontSize={"lg"} color={"gray.600"}>
            to enjoy all of our cool <Link to="#">features</Link> ✌️
          </Text>
        </Stack>
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          p={8}
        >
          <Stack spacing={4}>
            <Form method="post">
              <FormControl id="name" isRequired>
                <FormLabel>Name</FormLabel>
                {actionData?.errors?.name && (
                  <Alert status="error">
                    <AlertIcon />
                    {actionData.errors.name}
                  </Alert>
                )}
                <Input name="name" type="text" />
              </FormControl>
              <FormControl id="email" isRequired>
                <FormLabel>Email address</FormLabel>
                {actionData?.errors?.email && (
                  <Alert status="error">
                    <AlertIcon />
                    {actionData.errors.email}
                  </Alert>
                )}
                <Input name="email" type="email" />
              </FormControl>
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                {actionData?.errors?.password && (
                  <Alert status="error">
                    <AlertIcon />
                    {actionData.errors.password}
                  </Alert>
                )}
                <Input name="password" type="password" />
              </FormControl>
              <FormControl id="confirm-password" isRequired>
                <FormLabel>Confirm Password</FormLabel>
                {actionData?.errors?.confirmPassword && (
                  <Alert status="error">
                    <AlertIcon />
                    {actionData.errors.confirmPassword}
                  </Alert>
                )}
                <Input name="confirm-password" type="password" />
              </FormControl>

              <Stack spacing={10} pt={2}>
                <Button
                  type="submit"
                  loadingText="Submitting"
                  size="lg"
                  colorScheme="teal"
                >
                  Sign up
                </Button>
              </Stack>
            </Form>

            <Stack pt={6}>
              <Text align={"center"}>
                Already a user?{" "}
                <Link to="/home/signin" color={"blue.400"}>
                  Sign in
                </Link>
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
}
