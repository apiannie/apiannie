import { json, LoaderArgs, redirect } from "@remix-run/node";
import { requireUser } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  let user = await requireUser(request);
  let workspaces = user.workspaces;

  if (workspaces.length === 0) {
    return redirect(`/workspaces/new`);
  } else {
    return redirect(`/workspaces/${workspaces[0].id}`);
  }
}
