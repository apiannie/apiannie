import { ApiData, ParamType, RequestMethod } from "@prisma/client";
import { prisma } from "./prisma.server";

export const createGroup = async ({
  parentId,
  projectId,
  name,
}: {
  parentId?: string;
  projectId: string;
  name: string;
}) => {
  if (parentId === "") {
    parentId = undefined;
  }
  return prisma.group.create({
    data: {
      projectId: projectId,
      parentId: parentId,
      name: name,
    },
  });
};

export const updateGroup = async ({
  id,
  parentId,
  name,
  description,
}: {
  id: string;
  name?: string;
  parentId?: string | undefined;
  description?: string;
}) => {
  return prisma.group.update({
    where: {
      id: id,
    },
    data: {
      name,
      description,
      parentId,
    },
  });
};

export const getGroupById = async (id: string) => {
  let group = await prisma.group.findFirst({
    where: {
      id: id,
    },
  });
  if (!group) {
    return null;
  }
  group.description ||= "";
  return group;
};

export const createApi = async (
  projectId: string,
  groupId: string | undefined,
  data: { name: string; path: string; method: RequestMethod }
) => {
  if (groupId === "") {
    groupId = undefined;
  }
  let api = await prisma.api.create({
    data: {
      projectId: projectId,
      groupId: groupId,
      data: data,
    },
  });
  return api;
};

export const getApiById = async (id: string) => {
  return prisma.api.findFirst({
    where: { id },
  });
};

export const updateApi = async (
  id: string,
  data: {
    groupId?: string | undefined;
    data?: { name: string; path: string; method: RequestMethod };
  }
) => {
  return prisma.api.update({
    where: {
      id: id,
    },
    data: data,
  });
};

export const saveApiData = async (id: string, data: ApiData) => {
  return prisma.api.update({
    where: {
      id: id,
    },
    data: {
      data: data,
    },
  });
};
