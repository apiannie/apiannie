import {
  Box,
  Divider,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Spacer,
} from "@chakra-ui/react";
import { FiFilePlus, FiFolderPlus } from "react-icons/fi";

export const handle = {
  sideNav: <SideNav />,
};

function SideNav() {
  return (
    <Grid templateRows={"40px minmax(0, 1fr)"}>
      <GridItem>
        <HStack px={2}>
          <Heading ml="2" fontWeight={"500"} size={"sm"} color="gray.400">
            APIs
          </Heading>
          <Spacer />
          <Box>
            <IconButton
              aria-label="add group"
              icon={<FiFolderPlus />}
              variant="ghost"
              colorScheme="gray"
            />
            <IconButton
              aria-label="add api"
              icon={<FiFilePlus />}
              variant="ghost"
              colorScheme="gray"
            />
          </Box>
        </HStack>
        <Divider />
      </GridItem>
      <GridItem overflowY={"auto"}>
        <Box h="120vh">API list</Box>
      </GridItem>
    </Grid>
  );
}

export default function Apis() {
  return <Box h="100vh">Apis</Box>;
}
