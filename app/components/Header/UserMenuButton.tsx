import {
  Avatar,
  AvatarProps,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { useSubmit } from "@remix-run/react";

export default function UserMenuButton(props: { avatar: AvatarProps["src"] }) {
  const submit = useSubmit();

  return (
    <Flex alignItems={"center"}>
      <Menu>
        <MenuButton
          as={Button}
          rounded={"full"}
          variant={"link"}
          cursor={"pointer"}
          minW={0}
        >
          <Avatar src={props.avatar} size={"sm"}></Avatar>
        </MenuButton>
        <MenuList>
          <MenuItem>Link 1</MenuItem>
          <MenuItem>Link 2</MenuItem>
          <MenuDivider />
          <MenuItem
            onClick={(e) =>
              submit(null, { method: "post", action: "/account/logout" })
            }
          >
            Sign out
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}
