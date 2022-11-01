import { Spinner } from "@chakra-ui/react";
import { lazy, Suspense } from "react";
import { IAceEditorProps } from "react-ace";

const AceEditor = lazy(() => import("./_AceEditor"));

export default function (props: IAceEditorProps) {
  return (
    <Suspense fallback={<Spinner />}>
      <AceEditor {...props} />
    </Suspense>
  );
}
