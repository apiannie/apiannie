import {
  Alert,
  AlertIcon,
  Box,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Select,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { WorkspaceUser } from "@prisma/client";
import { json } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import React from "react";
import { useField, validationError } from "remix-validated-form";
import { z } from "zod";
import { createProject } from "~/models/project.server";
import { User } from "~/models/user.server";
import FormCancelButton from "~/ui/Form/FormCancelButton";
import FormInput from "~/ui/Form/FormInput";
import FormModal from "~/ui/Form/FormModal";
import FormSubmitButton from "~/ui/Form/FormSubmitButton";
import { Action } from "./constants";

export const newProjectValidator = withZod(
  z.object({
    name: z.string().min(1, "project name is required"),
  })
);

export const newProjectAction = async ({
  formData,
  user,
  workspaceId,
}: {
  formData: FormData;
  user: User;
  workspaceId: string;
}) => {
  const result = await newProjectValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }

  const { name } = result.data;

  let project = await createProject(user, workspaceId, name);
  return json({ project });
};

export default function NewProjectModal({
  isOpen,
  onClose,
  users,
}: {
  isOpen: ModalProps["isOpen"];
  onClose: ModalProps["onClose"];
  users: WorkspaceUser[];
}) {
  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);

  return (
    <FormModal
      initialFocusRef={initialRef}
      finalFocusRef={finalRef}
      isOpen={isOpen}
      onClose={onClose}
      validator={newProjectValidator}
      replace
      method="post"
      size="lg"
    >
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>Create project</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormInput name="name" label="Name" placeholder="Project name" />
        </ModalBody>

        <ModalFooter>
          <FormCancelButton onClick={onClose} mr={3}>
            Cancel
          </FormCancelButton>
          <FormSubmitButton
            type="submit"
            name="_action"
            value={Action.NEW_PROJECT}
            colorScheme="blue"
          >
            Create
          </FormSubmitButton>
        </ModalFooter>
      </ModalContent>
    </FormModal>
  );
}
