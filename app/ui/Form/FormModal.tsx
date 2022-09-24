import { Modal, ModalProps } from "@chakra-ui/react";
import { useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import {
  FormProps,
  useIsSubmitting,
  ValidatedForm,
} from "remix-validated-form";

export type FormModalProps<DataType> = Omit<
  ModalProps & FormProps<DataType>,
  "fetcher"
>;

export default function FormModal<DataType>({
  onClose,

  children,
  validator,
  onSubmit,
  defaultValue,
  formRef,
  subaction,
  resetAfterSubmit,
  disableFocusOnError,

  replace,
  method,
  action,

  ...rest
}: FormModalProps<DataType>) {
  const fetcher = useFetcher();
  const close = () => {
    if (fetcher.state === "idle") {
      fetcher.data = undefined;
      onClose();
    }
  };

  useEffect(() => {
    if (fetcher.type === "done") {
      if (!fetcher.data.fieldErrors) {
        onClose();
      }
    }
  }, [fetcher.type]);

  return (
    <Modal onClose={close} {...rest}>
      <ValidatedForm
        validator={validator}
        onSubmit={onSubmit}
        fetcher={fetcher}
        defaultValue={defaultValue}
        formRef={formRef}
        subaction={subaction}
        resetAfterSubmit={resetAfterSubmit}
        disableFocusOnError={disableFocusOnError}
        replace={replace}
        method={method}
        action={action}
      >
        {children}
      </ValidatedForm>
    </Modal>
  );
}
