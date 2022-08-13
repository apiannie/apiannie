import logo from "~/images/logo.svg";
import Main from "./Main";
import Header from "./Header";
export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap",
    },
  ];
}

export default function Index() {
  return (
    <>
      <Header />
      <Main />
    </>
  );
}
