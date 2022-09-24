import {
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";
import { redirect } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import React from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";
import { User } from "~/models/user.server";
import { createWorkspace } from "~/models/workspace.server";
import FormCancelButton from "~/ui/Form/FormCancelButton";
import FormInput from "~/ui/Form/FormInput";
import FormModal from "~/ui/Form/FormModal";
import FormSubmitButton from "~/ui/Form/FormSubmitButton";
import { Action } from "./constants";

export const newWorkspaceValidator = withZod(
  z.object({
    name: z.string().min(1, "workspace name is required"),
  })
);

export const newWorkspaceAction = async ({
  formData,
  user,
}: {
  formData: FormData;
  user: User;
}) => {
  const result = await newWorkspaceValidator.validate(formData);

  if (result.error) {
    return validationError(result.error);
  }

  let workspace = await createWorkspace(user, result.data.name);
  return redirect(`/workspaces/${workspace.id}`);
};

export default function NewWorkspaceModal({
  isOpen,
  onClose,
}: {
  isOpen: ModalProps["isOpen"];
  onClose: ModalProps["onClose"];
}) {
  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);

  return (
    <FormModal
      initialFocusRef={initialRef}
      finalFocusRef={finalRef}
      isOpen={isOpen}
      onClose={onClose}
      validator={newWorkspaceValidator}
      replace
      method="post"
    >
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>Create workspace</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormInput name="name" label="Name" placeholder="Workspace name" />
        </ModalBody>

        <ModalFooter>
          <FormCancelButton onClick={onClose} mr={3}>
            Cancel
          </FormCancelButton>
          <FormSubmitButton
            type="submit"
            name="_action"
            value={Action.NEW_WORKSPACE}
            colorScheme="blue"
          >
            Create
          </FormSubmitButton>
        </ModalFooter>
      </ModalContent>
    </FormModal>
  );
}
