import {
  Avatar,
  AvatarProps,
  BoxProps,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { useSubmit } from "@remix-run/react";

export default function UserMenuButton({
  size,
  avatar,
  ...props
}: Omit<AvatarProps, "avatar"> & {
  avatar: AvatarProps["src"];
}) {
  const submit = useSubmit();

  return (
    <Menu>
      <MenuButton
        as={Button}
        rounded={"full"}
        variant={"link"}
        cursor={"pointer"}
        minW={0}
      >
        <Avatar size={size || "sm"} src={avatar} {...props}></Avatar>
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
  );
}
