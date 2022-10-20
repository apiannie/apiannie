import {
  Flex,
  Heading,
  Text,
  Stack,
  useColorModeValue,
  Box,
  Container,
  Center,
  useToast,
} from "@chakra-ui/react";
import { ActionArgs } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";
import {
  getUserById,
  updatePassword,
  updateUserInfo,
} from "~/models/user.server";
import { getUser, requireUser, requireUserId } from "~/session.server";
import { FormHInput, FormSubmitButton, Header } from "~/ui";
import { httpResponse, useUser } from "~/utils";
import Layout from "./..lib/Layout";
import bcrypt from "bcryptjs";
import { json } from "remix-utils";
import { useActionData, useSubmit, useTransition } from "@remix-run/react";
import { useEffect } from "react";

export const action = async ({ request }: ActionArgs) => {
  let userId = await requireUserId(request);
  let formData = await request.formData();
  let action = formData.get("_action");
  switch (action) {
    case "updateInfo": {
      let result = await accountValidator.validate(formData);
      if (result.error) {
        return validationError(result.error);
      }
      await updateUserInfo(userId, result.data);
      break;
    }

    case "changePassword": {
      let result = await passwordValidator.validate(formData);
      if (result.error) {
        return validationError(result.error);
      }

      let { passwordCurrent, passwordConfirm, passwordNew } = result.data;
      if (passwordNew !== passwordConfirm) {
        return validationError(
          { fieldErrors: { passwordConfirm: "Password does not match" } },
          undefined,
          { status: 400 }
        );
      }

      let user = await getUserById(userId);
      if (!user) {
        return httpResponse.BadRequest;
      }

      const isValid = await bcrypt.compare(passwordCurrent, user.password);
      if (!isValid) {
        return validationError(
          {
            fieldErrors: {
              passwordCurrent: "Password does not match our record",
            },
          },
          undefined,
          { status: 400 }
        );
      }

      await updatePassword(userId, passwordNew);
      break;
    }

    default:
      return httpResponse.BadRequest;
  }
  return json({ action: action });
};

const accountValidator = withZod(
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Please input your name" })
      .min(2, { message: "Name should contain at least 2 characters" }),
  })
);

const passwordValidator = withZod(
  z.object({
    passwordCurrent: z
      .string()
      .min(1, { message: "Please input your password" }),
    passwordNew: z
      .string()
      .min(1, { message: "Please input your new password" })
      .min(8, { message: "Length of password should be at least 8" })
      .max(32, "Length of password should not exceed 32"),
    passwordConfirm: z
      .string()
      .min(1, { message: "Please input your confirm password" }),
  })
);

export default function Settings() {
  const user = useUser();
  const bg = useColorModeValue("gray.100", "gray.700");
  const bgBW = useColorModeValue("white", "gray.900");
  const labelWidth = 280;
  const toast = useToast();
  let transition = useTransition();

  useEffect(() => {
    if (transition.state === "loading") {
      let action = transition.submission?.formData?.get("_action");
      if (action === "updateInfo") {
        toast({
          title: "Account updated.",
          status: "success",
          position: "top",
        });
      } else if (action === "changePassword") {
        toast({
          title: "Password changed.",
          status: "success",
          position: "top",
        });
      }
    }
  }, [transition.state]);

  return (
    <Layout>
      <Container mt={8} maxW="container.lg">
        <Header>Account</Header>
        <Box
          bg={bg}
          pr={labelWidth}
          pt={8}
          pb={12}
          as={ValidatedForm}
          validator={accountValidator}
          replace
          method="patch"
        >
          <FormHInput
            container={{ mt: 4 }}
            label="Email"
            name="email"
            p={2}
            labelWidth={labelWidth}
            as={Text}
            w="full"
          >
            {user.email}
          </FormHInput>
          <FormHInput
            container={{ mt: 4 }}
            label="Name"
            name="name"
            labelWidth={labelWidth}
            bg={bgBW}
            defaultValue={user.name}
          />

          <Center mt={4} pl={labelWidth}>
            <FormSubmitButton
              name="_action"
              value="updateInfo"
              w={160}
              colorScheme={"blue"}
            >
              Save
            </FormSubmitButton>
          </Center>
        </Box>

        <Header mt={12}>Password</Header>
        <Box
          bg={bg}
          pr={labelWidth}
          pt={8}
          pb={12}
          as={ValidatedForm}
          validator={passwordValidator}
          replace
          method="patch"
          resetAfterSubmit
        >
          <FormHInput
            container={{ mt: 4 }}
            label="Current password"
            name="passwordCurrent"
            labelWidth={labelWidth}
            bg={bgBW}
            type="password"
          />
          <FormHInput
            container={{ mt: 4 }}
            label="New password"
            name="passwordNew"
            labelWidth={labelWidth}
            bg={bgBW}
            type="password"
          />
          <FormHInput
            container={{ mt: 4 }}
            label="Confirm password"
            name="passwordConfirm"
            labelWidth={labelWidth}
            bg={bgBW}
            type="password"
          />
          <Center mt={4} pl={labelWidth}>
            <FormSubmitButton
              name="_action"
              value="changePassword"
              w={160}
              colorScheme={"blue"}
            >
              Save
            </FormSubmitButton>
          </Center>
        </Box>
      </Container>
    </Layout>
  );
}
