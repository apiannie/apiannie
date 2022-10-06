import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import React, { useEffect, useRef } from "react";
import { useField, ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getGroupById, updateGroup } from "~/models/api.server";
import FormHInput from "~/ui/Form/FormHInput";
import FormSubmitButton from "~/ui/Form/FormSubmitButton";
import { MinimalInputProps } from "~/ui/Form/type";
import { httpResponse } from "~/utils";

export const loader = async ({ params }: LoaderArgs) => {
  let { groupId } = params;

  if (!groupId) {
    throw httpResponse.NotFound;
  }

  let group = await getGroupById(groupId);

  invariant(group);

  return json({ group: group });
};

export const action = async ({ request, params }: ActionArgs) => {
  let formData = await request.formData();
  let result = await validator.validate(formData);
  let { groupId } = params;

  invariant(groupId);

  if (result.error) {
    throw validationError(result.error);
  }

  let updated = await updateGroup({
    id: groupId,
    name: result.data.name,
    description: result.data.description,
  });

  return json(updated);
};

const validator = withZod(
  z.object({
    name: z.string().trim().min(1, "Group name is required"),
    description: z.string().trim(),
  })
);

export default function ApiGroup() {
  let { group } = useLoaderData<typeof loader>();
  let defaultValue = {
    name: group.name,
    description: group.description,
  };
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.reset();
  }, [group.id]);

  return (
    <Box p={5} pr={20} mx="auto" maxW={"64rem"}>
      <ValidatedForm
        validator={validator}
        method="patch"
        defaultValues={defaultValue}
        formRef={formRef}
      >
        <VStack spacing={6}>
          <FormHInput
            labelWidth="200px"
            name="name"
            label="Group name"
            isRequired
            input={Input}
          />
          <FormHInput
            labelWidth="200px"
            name="description"
            label="Description"
            input={Textarea}
          />
          <Center>
            <FormSubmitButton colorScheme="blue" px={12}>
              Save
            </FormSubmitButton>
          </Center>
        </VStack>
      </ValidatedForm>
    </Box>
  );
}
