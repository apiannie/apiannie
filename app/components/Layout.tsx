import Header from "./Header";
import Footer from "./Footer";
import { Grid } from "@chakra-ui/react";

type Props = {
  children: JSX.Element;
};

export default function Layout({ children }: Props) {
  return (
    <Grid templateRows="auto 1fr auto" minH="100vh">
      <Header />
      {children}
      <Footer />
    </Grid>
  );
}
