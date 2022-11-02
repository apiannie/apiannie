import { RequestMethod } from "@prisma/client";
import { ActionArgs, json, LoaderArgs, Response } from "@remix-run/node";
import { cors } from "remix-utils";
import invariant from "tiny-invariant";
import { findApisForMock, getApiById } from "~/models/api.server";
import { JsonNode } from "~/models/type";
import { httpResponse } from "~/utils";
import { mockJson } from "~/utils/mock";

export const loader = (args: LoaderArgs) => {
  return action(args);
};

export const action = async ({ params, request }: ActionArgs) => {
  if (request.method === RequestMethod.OPTIONS) {
    return await cors(request, new Response());
  }

  let projectId = params.projectId as string;
  let path = "/" + params["*"];
  let method = request.method as RequestMethod;
  let apis = await findApisForMock(projectId, method);
  let pathParam = findPathForRule(
    path,
    apis.map((api) => api.data.path)
  );
  if (!pathParam) {
    return httpResponse.NotFound;
  }
  let rule = pathParam.rule;
  let apiFound = apis.find((api) => api.data.path === rule);
  invariant(apiFound);
  let api = await getApiById(apiFound.id);
  invariant(api);

  let response: JsonNode | undefined = (api.data.response as any)?.["200"];
  let mocked = mockJson(response);

  return await cors(request, json(mocked));
};

function findPathForRule(path: string, rules: string[]) {
  let pathParams = rules
    .map((rule) => matchApi(path, rule))
    .filter((item): item is NonNullable<typeof item> => !!item);
  pathParams.sort((a, b) => b.weight - a.weight);
  return pathParams.length > 0 ? pathParams[0] : undefined;
}

/**
 *
 * @param {*} apiPath /user/tom
 * @param {*} apiRule /user/:username
 */
function matchApi(apiPath: string, apiRule: string) {
  let apiRules = apiRule.split("/");
  let apiPaths = apiPath.split("/");
  let pathParams = {
    rule: apiRule,
    weight: 0,
    params: {} as { [key in string]: string },
  };

  if (apiPaths.length !== apiRules.length) {
    return null;
  }
  for (let i = 0; i < apiRules.length; i++) {
    if (apiRules[i]) {
      apiRules[i] = apiRules[i].trim();
    } else {
      continue;
    }
    if (
      apiRules[i].length > 2 &&
      apiRules[i][0] === "{" &&
      apiRules[i][apiRules[i].length - 1] === "}"
    ) {
      pathParams.params[apiRules[i].substring(1, apiRules[i].length - 1)] =
        apiPaths[i];
    } else if (
      apiRules[i].length > 2 &&
      apiRules[i].indexOf("{") > -1 &&
      apiRules[i].indexOf("}") > -1
    ) {
      let params = [] as string[];
      apiRules[i] = apiRules[i].replace(/\{(.+?)\}/g, function (src, match) {
        params.push(match);
        return "([^\\/\\s]+)";
      });
      let regexp = new RegExp(apiRules[i]);
      if (!regexp.test(apiPaths[i])) {
        return null;
      }

      let matchs = apiPaths[i].match(regexp) || [];

      params.forEach((item, index) => {
        pathParams.params[item] = matchs[index + 1];
      });
    } else {
      if (apiRules[i] !== apiPaths[i]) {
        return null;
      } else {
        pathParams.weight++;
      }
    }
  }
  return pathParams;
}
