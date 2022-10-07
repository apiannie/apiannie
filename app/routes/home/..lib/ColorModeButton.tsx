import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { Button, ButtonProps, useColorMode } from "@chakra-ui/react";

export default function ColorModeButton(props: ButtonProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Button {...props} onClick={toggleColorMode}>
      {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
}
