import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  IconButton,
  Spacer,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, useParams } from "@remix-run/react";
import { FiBell } from "react-icons/fi";
import invariant from "tiny-invariant";
import { getApiById } from "~/models/api.server";
import ColorModeButton from "~/routes/home/..lib/ColorModeButton";
import UserMenuButton from "~/routes/home/..lib/UserMenuButton";
import { httpResponse } from "~/utils";
import Editor, { saveApiAction } from "./..editor";
import Postman from "./..postman";

export const handle = {
  tabs: ["Info", "Edit", "Exec", "Mock"],
};

export const loader = async ({ request, params }: LoaderArgs) => {
  let { apiId } = params;
  invariant(apiId);

  let api = await getApiById(apiId);

  if (!api) {
    throw httpResponse.BadRequest;
  }

  return json({ api, url: request.url });
};

export const action = async ({ request, params }: ActionArgs) => {
  let { apiId } = params;
  invariant(apiId);
  let formData = await request.formData();

  if (formData.get("_action") === "test") {
    throw httpResponse.NotFound;
  }

  await saveApiAction(apiId, formData);

  return json({});
};

export default function ApiInfo() {
  const { apiId } = useParams();
  return (
    <TabPanels h="full" overflowY={"auto"} key={apiId}>
      <TabPanel>
        <Box>
          <Form method="post" replace>
            <Button type="submit" name="_action" value="test">
              Test
            </Button>
          </Form>
        </Box>
      </TabPanel>
      <TabPanel>
        <Editor />
      </TabPanel>
      <TabPanel h="full" p={0}>
        <Postman />
      </TabPanel>
      <TabPanel p={0}>Mock</TabPanel>
    </TabPanels>
  );
}
