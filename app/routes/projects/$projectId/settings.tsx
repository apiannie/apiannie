import {
  Box,
  Divider,
  Flex,
  FlexProps,
  Grid,
  Icon,
  Link,
  Spacer,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { NavLink, Outlet, useParams } from "@remix-run/react";
import { ReactNode } from "react";
import { IconType } from "react-icons";
import { FiSettings, FiUsers } from "react-icons/fi";
import invariant from "tiny-invariant";
import { ProjecChangeButton } from "../$projectId";

export const handle = {
  sideNav: <SideNav />,
  tabs: ["Settings"],
};

function SideNav() {
  const { projectId } = useParams();
  invariant(projectId);
  return (
    <Grid
      position={"relative"}
      bg={useColorModeValue("gray.50", "gray.800")}
      templateRows="50px 1px minmax(0, 1fr)"
      h="100vh"
    >
      <ProjecChangeButton />
      <Divider />
      <VStack spacing={0}>
        <NavItem
          to={`/projects/${projectId}/settings`}
          w="full"
          icon={FiSettings}
          end
        >
          General
        </NavItem>
        <NavItem
          to={`/projects/${projectId}/settings/members`}
          w="full"
          icon={FiUsers}
        >
          Members
        </NavItem>
      </VStack>
    </Grid>
  );
}

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: ReactNode;
  isActive?: boolean;
  to: string;
  end?: boolean;
}

const NavItem = ({ icon, children, to, end, ...rest }: NavItemProps) => {
  const hoverBG = useColorModeValue("cyan.100", "cyan.800");
  const activeBG = useColorModeValue("blue.200", "blue.700");
  return (
    <NavLink to={to} style={{ width: "100%" }} end={end}>
      {({ isActive }) => (
        <Flex
          w="full"
          align="center"
          py={2}
          px={4}
          borderRadius="lg"
          cursor="pointer"
          _hover={{
            bg: isActive ? activeBG : hoverBG,
          }}
          bg={isActive ? activeBG : undefined}
          justifyContent="space-between"
          {...rest}
        >
          {icon && <Icon mr="4" fontSize="16" as={icon} />}
          <Spacer />
          <Link
            href="#"
            style={{ textDecoration: "none" }}
            _focus={{ boxShadow: "none" }}
          >
            {children}
          </Link>
        </Flex>
      )}
    </NavLink>
  );
};

export default function Settings() {
  return <Outlet />;
}
