import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { Button, useColorMode } from "@chakra-ui/react";

export default function ColorModeButton() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Button onClick={toggleColorMode} variant="outline">
      {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
}
