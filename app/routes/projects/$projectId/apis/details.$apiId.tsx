import { TabPanel, TabPanels } from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { RouteMatch, useMatches, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getApiById, getApiProjectId } from "~/models/api.server";
import { httpResponse } from "~/utils";
import Editor, { saveApiAction } from "./..editor";
import Postman from "./..postman";
import Api from "./..api";
import { requireUserId } from "~/session.server";
import { checkAuthority } from "~/models/project.server";
import { ProjectUserRole } from "@prisma/client";

export const handle = {
  tabs: (matches: RouteMatch[]) => {
    const role = matches[1].data.role as ProjectUserRole;
    const readOnly = role === "READ";
    return readOnly ? ["Api", "Exec"] : ["Api", "Edit", "Exec"];
  },
};

export const loader = async ({ request, params }: LoaderArgs) => {
  let { apiId } = params;
  invariant(apiId);
  let userId = await requireUserId(request);

  let api = await getApiById(apiId);

  if (!api) {
    throw httpResponse.BadRequest;
  }

  if (!(await checkAuthority(userId, api.projectId, ProjectUserRole.READ))) {
    throw httpResponse.Forbidden;
  }
  return json({ api });
};

export const action = async ({ request, params }: ActionArgs) => {
  let userId = await requireUserId(request);
  let { apiId } = params;
  invariant(apiId);

  let projectId = await getApiProjectId(apiId);
  if (!projectId) {
    return httpResponse.BadRequest;
  }

  if (!(await checkAuthority(userId, projectId, "WRITE"))) {
    return httpResponse.Forbidden;
  }

  let formData = await request.formData();
  let action = formData.get("_action");
  if (action === "saveApi") {
    return await saveApiAction(apiId, formData);
  }
  throw httpResponse.NotFound;
};

export default function ApiInfo() {
  const matches = useMatches();
  const role = matches[1].data.role as ProjectUserRole;
  const readOnly = role === "READ";
  const { apiId } = useParams();
  return (
    <TabPanels h="full" overflowY={"hidden"} key={apiId}>
      <TabPanel h="full" overflowY={"auto"}>
        <Api />
      </TabPanel>
      {!readOnly && (
        <TabPanel h="full" overflow={"auto"}>
          <Editor />
        </TabPanel>
      )}
      <TabPanel h="full" p={0}>
        <Postman />
      </TabPanel>
      <TabPanel p={0}>Mock</TabPanel>
    </TabPanels>
  );
}
