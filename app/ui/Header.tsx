import { Heading, HeadingProps } from "@chakra-ui/react";

const Header = (props: HeadingProps) => {
  return (
    <Heading
      borderLeft={"3px solid #2395f1"}
      pl={2}
      size={"md"}
      mb={4}
      {...props}
    />
  );
};

export default Header;
