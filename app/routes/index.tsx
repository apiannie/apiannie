import { LoaderArgs, redirect } from "@remix-run/node";
import { getUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/workspaces");
  else return redirect("/home");
}
