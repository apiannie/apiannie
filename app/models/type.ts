import { ParamType, RequestMethod } from "@prisma/client";

export const JsonNodeType = [
  ParamType.OBJECT,
  ParamType.ARRAY,
  ParamType.STRING,
  ParamType.FLOAT,
  ParamType.INT,
] as const;

export const RequestMethods = [
  RequestMethod.GET,
  RequestMethod.POST,
  RequestMethod.PUT,
  RequestMethod.PATCH,
  RequestMethod.DELETE,
  RequestMethod.OPTION,
  RequestMethod.HEAD,
] as const;

export interface JsonNode {
  name?: string;
  mock?: string;
  isRequired?: string;
  description?: string;
  type: Exclude<ParamType, "FILE">;
  children: JsonNode[];
}
