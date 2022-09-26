import {
  Box,
  BoxProps,
  CloseButton,
  Divider,
  Drawer,
  DrawerContent,
  Flex,
  FlexProps,
  Grid,
  GridItem,
  Hide,
  HStack,
  Icon,
  IconButton,
  Image,
  Link,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Link as RemixLink,
  Outlet,
  useParams,
  useTransition,
} from "@remix-run/react";
import { ReactNode } from "react";
import { IconType } from "react-icons";
import { FiBell, FiLayers, FiMenu, FiPlus } from "react-icons/fi";
import logo from "~/images/logo.png";
import { useUser } from "~/utils";
import ColorModeButton from "../../home/..lib/ColorModeButton";
import UserMenuButton from "../../home/..lib/UserMenuButton";
import NewWorkspaceModal from "./NewWorkspaceModal";

export default function Layout({ children }: { children: ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <Hide below="md">
        <SidebarContent onClose={() => onClose} />
      </Hide>
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 72 }} p="4">
        {children}
      </Box>
    </Box>
  );
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  // const { workspaces } = useLoaderData<typeof loader>();
  const user = useUser();
  const modal = useDisclosure();
  const params = useParams();
  const transition = useTransition();

  let workspaceId = params.workspaceId;

  if (transition.location?.pathname) {
    workspaceId = transition.location.pathname.substring("/workspaces/".length);
  }

  return (
    <Grid
      transition="3s ease"
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 72 }}
      pos="fixed"
      h="full"
      templateRows={"100px 60px 1fr"}
      {...rest}
    >
      <Flex alignItems="center" mx="8" justifyContent="space-between">
        <Image
          src={logo}
          display={{ base: "none", md: "flex" }}
          height="32px"
        />
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      <GridItem>
        <NavItem
          icon={FiPlus}
          active={false}
          borderWidth="1px"
          borderColor="gray.200"
          borderStyle="dashed"
          mb={1}
          onClick={modal.onOpen}
        >
          Add workspace
        </NavItem>
        <NewWorkspaceModal isOpen={modal.isOpen} onClose={modal.onClose} />
        <Divider />
      </GridItem>
      <GridItem overflowY="auto">
        {user.workspaces.map((workspace) => (
          <Link
            to={`/workspaces/${workspace.id}`}
            as={RemixLink}
            style={{ textDecoration: "none" }}
            _focus={{ boxShadow: "none" }}
            key={workspace.id}
          >
            <NavItem icon={FiLayers} active={workspace.id === workspaceId}>
              <Text noOfLines={1}>{workspace.name}</Text>
            </NavItem>
          </Link>
        ))}
      </GridItem>
    </Grid>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: ReactNode;
  active?: boolean;
}
const NavItem = ({ icon, children, active, ...rest }: NavItemProps) => {
  return (
    <Flex
      align="center"
      p="3"
      mx="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      _hover={
        active
          ? undefined
          : {
              bg: "cyan.200",
              color: "white",
            }
      }
      bg={active ? "cyan.400" : undefined}
      color={active ? "white" : undefined}
      {...rest}
    >
      {icon && (
        <Icon
          mr="4"
          fontSize="16"
          _groupHover={{
            color: "white",
          }}
          as={icon}
        />
      )}
      {children}
    </Flex>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  const user = useUser();

  return (
    <Flex
      ml={{ base: 0, md: 72 }}
      px={{ base: 4, md: 4 }}
      height="12"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: "flex", md: "none" }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
      >
        Logo
      </Text>

      <HStack spacing={{ base: "0", md: "6" }}>
        <ColorModeButton />
        <IconButton
          size="md"
          variant="ghost"
          aria-label="open menu"
          icon={<FiBell />}
        />
        <UserMenuButton avatar={user.avatar || undefined} />
      </HStack>
    </Flex>
  );
};
