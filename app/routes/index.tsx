import { json, LoaderArgs, redirect } from "@remix-run/node";
import LandingPage, { links } from "~/components/LandingPage";
import { getUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  return json({});
}

export default LandingPage;
export { links };
