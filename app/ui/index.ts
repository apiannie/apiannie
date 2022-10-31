import { lazy } from "react";
import FormCancelButton from "./Form/FormCancelButton";
import FormHInput from "./Form/FormHInput";
import FormInput from "./Form/FormInput";
import FormModal from "./Form/FormModal";
import FormSubmitButton from "./Form/FormSubmitButton";
import ModalInput from "./Form/ModalInput";
import PathInput from "./Form/PathInput";
import Header from "./Header";

export const AceEditor = lazy(() => import("./AceEditor"));

export {
  FormCancelButton,
  FormHInput,
  FormInput,
  FormModal,
  FormSubmitButton,
  ModalInput,
  PathInput,
  Header,
};
