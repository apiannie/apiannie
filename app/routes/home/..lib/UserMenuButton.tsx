import {
  Avatar,
  AvatarProps,
  Box,
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { Link, useSubmit } from "@remix-run/react";

export default function UserMenuButton({
  size,
  avatar,
  name,
  ...props
}: Omit<AvatarProps, "avatar"> & {
  avatar?: string;
  name: string;
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
        <Box px={3} fontSize="sm">
          <Text>Signed in as</Text>
          <Text fontWeight={"bold"}>{name}</Text>
        </Box>
        <MenuDivider />
        <MenuItem as={Link} to="/home/settings">
          Settings
        </MenuItem>
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
