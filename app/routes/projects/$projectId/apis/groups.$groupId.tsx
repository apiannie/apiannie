import {
  Box,
  Center,
  Input,
  TabPanel,
  TabPanels,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useLoaderData, useTransition } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect, useRef } from "react";
import { ValidatedForm, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getGroupById, updateGroup } from "~/models/api.server";
import { checkAuthority } from "~/models/project.server";
import { requireUserId } from "~/session.server";
import FormHInput from "~/ui/Form/FormHInput";
import FormSubmitButton from "~/ui/Form/FormSubmitButton";
import { httpResponse } from "~/utils";

export const handle = {
  tabs: ["Edit Group"],
};

export const loader = async ({ request, params }: LoaderArgs) => {
  let userId = await requireUserId(request);
  let { groupId } = params;
  if (!groupId) {
    throw httpResponse.NotFound;
  }

  let group = await getGroupById(groupId);

  invariant(group);

  if (!checkAuthority(userId, group.projectId, "READ")) {
    throw httpResponse.Forbidden;
  }

  return json({ group: group });
};

export const action = async ({ request, params }: ActionArgs) => {
  let { groupId } = params;
  invariant(groupId);
  let userId = await requireUserId(request);

  let group = await getGroupById(groupId);
  if (!group) {
    return httpResponse.BadRequest;
  }

  if (!checkAuthority(userId, group.projectId, "WRITE")) {
    return httpResponse.Forbidden;
  }

  let formData = await request.formData();
  let result = await validator.validate(formData);

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

  const transition = useTransition();
  const toast = useToast();

  useEffect(() => {
    if (transition.state === "loading") {
      let action = transition.submission?.formData?.get("_action");
      if (action === "saveGroup") {
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
    <TabPanels overflowY={"auto"}>
      <Box as={TabPanel} pb={5} pt={20} pr={20} mx="auto" maxW={"64rem"}>
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
              as={Input}
            />
            <FormHInput
              labelWidth="200px"
              name="description"
              label="Description"
              as={Textarea}
            />
            <Center>
              <FormSubmitButton
                name="_action"
                value="saveGroup"
                colorScheme="blue"
                px={12}
              >
                Save
              </FormSubmitButton>
            </Center>
          </VStack>
        </ValidatedForm>
      </Box>
    </TabPanels>
  );
}
