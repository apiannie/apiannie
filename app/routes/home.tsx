import { Outlet } from "@remix-run/react";
import Layout from "./home.parts/Layout";

export default function HomeLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
