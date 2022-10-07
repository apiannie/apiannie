import {
  Avatar,
  AvatarProps,
  BoxProps,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { useSubmit } from "@remix-run/react";

export default function UserMenuButton({
  avatar,
  ...rest
}: BoxProps & { avatar: AvatarProps["src"] }) {
  const submit = useSubmit();

  return (
    <Flex alignItems={"center"} {...rest}>
      <Menu>
        <MenuButton
          as={Button}
          rounded={"full"}
          variant={"link"}
          cursor={"pointer"}
          minW={0}
        >
          <Avatar src={avatar} size={"sm"}></Avatar>
        </MenuButton>
        <MenuList>
          <MenuItem>Link 1</MenuItem>
          <MenuItem>Link 2</MenuItem>
          <MenuDivider />
          <MenuItem
            onClick={(e) =>
              submit(null, { method: "post", action: "/home/logout" })
            }
          >
            Sign out
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}
