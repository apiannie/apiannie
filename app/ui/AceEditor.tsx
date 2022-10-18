import AceEditor, { IAceEditorProps } from "react-ace";

import "ace-builds/src-noconflict/mode-plain_text";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-json5";
import "ace-builds/src-noconflict/mode-xml";

import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/theme-terminal";

import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/worker-json";
import ace from "ace-builds";

ace.config.set(
  "basePath",
  "https://cdn.jsdelivr.net/npm/ace-builds@1.4.3/src-noconflict/"
);

import { useColorModeValue } from "@chakra-ui/react";

export default function (props: IAceEditorProps) {
  let { theme: _, ...rest } = props;
  const theme = useColorModeValue("xcode", "terminal");
  return <AceEditor theme={theme} {...rest} />;
}
