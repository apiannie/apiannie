import { TabPanel, TabPanels } from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useParams } from "@remix-run/react";
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
  tabs: ["Api", "Edit", "Exec"],
};

export const loader = async ({ request, params }: LoaderArgs) => {
  let { apiId } = params;
  invariant(apiId);
  let userId = await requireUserId(request);

  let api = await getApiById(apiId);

  if (!api) {
    throw httpResponse.BadRequest;
  }

  if (!checkAuthority(userId, api.projectId, ProjectUserRole.READ)) {
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

  if (!checkAuthority(userId, projectId, "WRITE")) {
    return httpResponse.Forbidden;
  }

  let formData = await request.formData();

  if (formData.get("_action") === "test") {
    throw httpResponse.NotFound;
  }

  return await saveApiAction(apiId, formData);
};

export default function ApiInfo() {
  const { apiId } = useParams();
  return (
    <TabPanels h="full" overflowY={"hidden"} key={apiId}>
      <TabPanel h="full" overflowY={"auto"}>
        <Api />
      </TabPanel>
      <TabPanel h="full" overflow={"auto"}>
        <Editor />
      </TabPanel>
      <TabPanel h="full" p={0}>
        <Postman />
      </TabPanel>
      <TabPanel p={0}>Mock</TabPanel>
    </TabPanels>
  );
}
