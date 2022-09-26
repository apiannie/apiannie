import {
  Box,
  Flex,
  Heading,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Link, useActionData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";
import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import FormInput from "~/ui/Form/FormInput";
import FormSubmitButton from "~/ui/Form/FormSubmitButton";
import { safeRedirect } from "~/utils";
import Layout from "./..lib/Layout";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/workspaces");
  return json({});
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const result = await validator.validate(formData);

  if (result.error) {
    return validationError(result.error);
  }

  const { name, email, password, passwordConfirm } = result.data;
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  const errors = {
    name: null,
    email: null,
    password: null,
    confirmPassword: null,
  };

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return validationError(
      { fieldErrors: { email: "A user already exists with this email" } },
      undefined,
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

export const validator = withZod(
  z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { message: "Please input your name" })
        .min(2, { message: "Name should contain at least 2 characters" }),
      email: z
        .string()
        .trim()
        .min(1, { message: "Please input your email" })
        .max(128, { message: "Email is too long (over 128)" })
        .email(),
      password: z
        .string()
        .min(1, { message: "Please input your password" })
        .min(8, { message: "Length of password should be at least 8" })
        .max(32, "Length of password should not exceed 32"),
      passwordConfirm: z
        .string()
        .min(1, { message: "Please input your confirm password" }),
    })
    .refine(({ password, passwordConfirm }) => password === passwordConfirm, {
      path: ["passwordConfirm"],
      message: "Passwords must match",
    })
);

export default function SignUp() {
  const actionData = useActionData<typeof action>();

  return (
    <Layout>
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
              <ValidatedForm validator={validator} method="post">
                <FormInput name="name" label="Name" type="text" />
                <FormInput name="email" label="Email" type="email" />
                <FormInput name="password" label="Password" type="password" />
                <FormInput
                  name="passwordConfirm"
                  label="Confirm Password"
                  type="password"
                />

                <Stack spacing={10} pt={2}>
                  <FormSubmitButton size="lg" colorScheme="teal">
                    Sign up
                  </FormSubmitButton>
                </Stack>
              </ValidatedForm>

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
    </Layout>
  );
}
