import { Link as ChakraLink } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";

type Props = {
  to: React.ComponentProps<typeof RemixLink>["to"];
  children: React.ReactNode;
  color?: React.ComponentProps<typeof ChakraLink>["color"];
  isExternal?: boolean;
};

export function Link({ to, children, isExternal, color, ...rest }: Props) {
  if (isExternal) {
    return (
      <ChakraLink isExternal href={to as string} {...rest}>
        {children}
      </ChakraLink>
    );
  }

  return (
    <RemixLink to={to}>
      <ChakraLink color={color} {...rest}>
        {children}
      </ChakraLink>
    </RemixLink>
  );
}
