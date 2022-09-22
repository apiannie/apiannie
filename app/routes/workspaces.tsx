import {
  Alert,
  AlertIcon,
  Box,
  BoxProps,
  Button,
  CloseButton,
  Divider,
  Drawer,
  DrawerContent,
  Flex,
  FlexProps,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightAddon,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { User } from "@prisma/client";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import {
  Outlet,
  useFetcher,
  useMatches,
  useParams,
  Link as RemixLink,
} from "@remix-run/react";
import React, { ReactNode, useEffect } from "react";
import { IconType } from "react-icons";
import { FiBell, FiFolder, FiMenu, FiPlus } from "react-icons/fi";
import Validator from "validatorjs";
import ColorModeButton from "~/components/Header/ColorModeButton";
import UserMenuButton from "~/components/Header/UserMenuButton";
import logo from "~/images/logo.png";
import {
  createWorkspace,
  getWorkspacesByUserId,
} from "~/models/workspace.server";
import { requireUser, requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export async function loader({ request }: LoaderArgs) {
  // console.log(request, context, params);
  let userId = await requireUserId(request);
  let workspaces = await getWorkspacesByUserId(userId);
  // return json({
  //   user: { ...user },
  // });
  return json({
    workspaces: workspaces,
  });
}

enum Action {
  NEW_WORKSPACE = "NEW_WORKSPACE",
}

export async function action({ request }: ActionArgs) {
  let user = await requireUser(request);
  const data = Object.fromEntries(await request.formData());

  switch (data._action) {
    case Action.NEW_WORKSPACE:
      return createWorkspaceAction(data, user);
    default:
      return {
        status: 400,
      };
  }
}

async function createWorkspaceAction(
  data: {
    [k: string]: FormDataEntryValue;
  },
  user: User
) {
  const validator = new Validator(data, {
    name: ["required", "string"],
  });

  if (validator.fails()) {
    return json({
      errors: validator.errors.errors,
      status: 400,
    });
  }

  let workspace = await createWorkspace(user, data.name as string);
  return redirect(`/workspaces/${workspace.id}`);
}

export default function Workspaces() {
  const user = useUser();
  return (
    <SidebarWithHeader>
      <Outlet />
    </SidebarWithHeader>
  );
}

interface LinkItemProps {
  name: string;
  icon: IconType;
}
const LinkItems: Array<LinkItemProps> = [
  { name: "Home", icon: FiFolder },
  { name: "Trending", icon: FiFolder },
  { name: "Explore", icon: FiFolder },
  { name: "Favourites", icon: FiFolder },
  { name: "Settings", icon: FiFolder },
];

function SidebarWithHeader({ children }: { children: ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
      />
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

  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 72 }}
      pos="fixed"
      h="full"
      {...rest}
      overflowY="auto"
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Image
          src={logo}
          display={{ base: "none", md: "flex" }}
          height="32px"
        />
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      <InputGroup alignItems="center" p={4} justifyContent="space-between">
        <Input placeholder="Search workspace" mr={1} />
        <IconButton
          aria-label="Add workspace"
          size="md"
          icon={<FiPlus />}
          onClick={modal.onOpen}
        />
      </InputGroup>
      <NewWorkspaceModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        action="NEW_WORKSPACE"
      />
      <Divider my="2" />
      {user.workspaces.map((workspace) => (
        <NavItem
          key={workspace.id}
          icon={FiFolder}
          active={workspace.id === params.workspaceId}
          to={`/workspaces/${workspace.id}`}
        >
          {workspace.name}
        </NavItem>
      ))}
    </Box>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: string | number;
  active?: boolean;
  to: string;
}
const NavItem = ({ icon, children, active, to, ...rest }: NavItemProps) => {
  return (
    <Link
      to={to}
      as={RemixLink}
      style={{ textDecoration: "none" }}
      _focus={{ boxShadow: "none" }}
    >
      <Flex
        align="center"
        p="4"
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
    </Link>
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

function NewWorkspaceModal({
  isOpen,
  onClose,
  action,
}: {
  isOpen: ModalProps["isOpen"];
  onClose: ModalProps["onClose"];
  action: string;
}) {
  const fetcher = useFetcher();
  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);
  let errors = (fetcher.data?.errors || {}) as Validator.ValidationErrors;

  useEffect(() => {
    if (fetcher.type === "done" && Object.keys(errors).length == 0) {
      onClose();
    }
  }, [fetcher.type]);

  return (
    <Modal
      initialFocusRef={initialRef}
      finalFocusRef={finalRef}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <fetcher.Form replace method="post">
        <ModalContent>
          <ModalHeader>Create workspace</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                name="name"
                ref={initialRef}
                placeholder="Workspace name"
              />
              {errors.name && (
                <Alert status="error">
                  <AlertIcon />
                  {errors.name}
                </Alert>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              type="submit"
              name="_action"
              value={action}
              colorScheme="blue"
              mr={3}
            >
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </fetcher.Form>
    </Modal>
  );
}
