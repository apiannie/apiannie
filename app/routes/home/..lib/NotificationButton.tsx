import {
  Button,
  Center,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@chakra-ui/react";
import React from "react";
import { FiBell } from "react-icons/fi";

const NotificationButton = () => {
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="ghost">
          <Icon aria-label="open menu" as={FiBell} />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        {/* <PopoverCloseButton /> */}
        {/* <PopoverHeader>Confirmation!</PopoverHeader> */}
        <PopoverBody>
          <Center minH={48} color="gray.400">
            No notifications
          </Center>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationButton;
