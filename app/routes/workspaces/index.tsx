import { json, LoaderArgs, redirect } from "@remix-run/node";
import { requireUser, requireUserId } from "~/session.server";

export async function loader({ request, params }: LoaderArgs) {
  let userId = await requireUserId(request);
  let user = await requireUser(request);
  let { workspaceId } = params;
  let workspaces = user.workspaces;
  if (workspaces.length === 0) {
    return redirect(`/workspaces/new`);
  } else if (!workspaceId) {
    return redirect(`/workspaces/${workspaces[0].id}`);
  }
}
