import {
  ParamType,
  Prisma,
  ProjectUserRole,
  RequestMethod,
} from "@prisma/client";

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
  name: string;
  isRequired: boolean;
  type: Exclude<ParamType, "FILE">;
  mock?: string;
  example?: string;
  description?: string;
  children: JsonNode[];
  arrayElem?: JsonNode;
}

export const ProjectUserRoles = [
  ProjectUserRole.READ,
  ProjectUserRole.WRITE,
  ProjectUserRole.ADMIN,
] as const;
