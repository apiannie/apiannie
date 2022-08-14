import { Link as ChakraLink } from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";

type Props = {
  plain?: boolean;
} & React.ComponentProps<typeof RemixLink> &
  React.ComponentProps<typeof ChakraLink>;

export function Link({ to, plain, children, isExternal, ...rest }: Props) {
  if (isExternal) {
    return (
      <ChakraLink isExternal href={to as string} {...rest}>
        {children}
      </ChakraLink>
    );
  }

  if (plain) {
    return <RemixLink to={to}>{children}</RemixLink>;
  }

  return (
    <ChakraLink as={RemixLink} to={to} {...rest}>
      {children}
    </ChakraLink>
  );
}
