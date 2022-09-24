import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  InputRightElement,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import {
  ActionArgs,
  json,
  LoaderArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { Link, useActionData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect, useRef, useState } from "react";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";
import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import FormInput from "~/ui/Form/FormInput";
import FormSubmitButton from "~/ui/Form/FormSubmitButton";
import { safeRedirect } from "~/utils";

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

  const { email, password, remember } = result.data;
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/workspaces");
  const user = await verifyLogin(email, password);

  if (!user) {
    return validationError(
      { fieldErrors: { password: "Incorrect password" } },
      result.submittedData,
      { status: 401 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: !!remember,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return {
    title: "Login | Api Annie",
  };
};

export const validator = withZod(
  z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: "Please input your email" })
      .email(),
    password: z.string().min(1, "Please input your password"),
    remember: z.string().optional(),
  })
);

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const actionData = useActionData();

  useEffect(() => {
    if (actionData?.fieldErrors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.fieldErrors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Flex minH={"100vh"} bg={useColorModeValue("gray.50", "gray.800")}>
      <Stack spacing={8} mx={"auto"} width="440px" maxW={"lg"} py={20} px={6}>
        <Stack align={"center"}>
          <Heading fontSize={"4xl"}>Sign in to your account</Heading>
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
          <ValidatedForm validator={validator} method="post">
            <Stack spacing={4}>
              <FormInput label="Email address" name="email" ref={emailRef} />
              <FormInput
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                ref={passwordRef}
              >
                <InputRightElement h={"full"}>
                  <Button
                    variant={"ghost"}
                    onClick={() =>
                      setShowPassword((showPassword) => !showPassword)
                    }
                  >
                    {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                  </Button>
                </InputRightElement>
              </FormInput>
              <Stack spacing={10}>
                <Stack
                  direction={{ base: "column", sm: "row" }}
                  align={"start"}
                  justify={"space-between"}
                >
                  <Checkbox name="remember" value="on">
                    Remember me
                  </Checkbox>
                </Stack>
                <FormSubmitButton type="submit" colorScheme="teal">
                  Sign in
                </FormSubmitButton>
              </Stack>
              <Stack pt={6}>
                <Text align={"center"}>
                  New to Api Annie?{" "}
                  <Link to="/home/signup" color={"blue.400"}>
                    Sign up
                  </Link>
                </Text>
              </Stack>
            </Stack>
          </ValidatedForm>
        </Box>
      </Stack>
    </Flex>
  );
}
