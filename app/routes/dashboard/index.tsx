import Layout from "~/components/Layout";
import { useOptionalUser } from "~/utils";

export default function Dashboard() {
  const user = useOptionalUser();
  return (
    <Layout>
      <main>Dashboard</main>
    </Layout>
  );
}
