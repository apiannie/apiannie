import { RequestParam } from ".prisma/client";
import { ApiData, RequestMethod } from "@prisma/client";
import { prisma } from "./prisma.server";
import { getProjectById, Group } from "./project.server";

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
  data: {
    name: string;
    path: string;
    method: RequestMethod;
    pathParams: RequestParam[];
  }
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

export const getApiProjectId = async (apiId: string) => {
  let api = await prisma.api.findFirst({
    where: {
      id: apiId,
    },
    select: {
      projectId: true,
    },
  });

  return api?.projectId;
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

export const findApisForMock = async (
  projectId: string,
  method: RequestMethod
) => {
  return prisma.api.findMany({
    where: {
      projectId: projectId,
      data: {
        is: {
          method: method,
        },
      },
    },
    select: {
      id: true,
      data: {
        select: {
          path: true,
        },
      },
    },
  });
};

export const deleteApi = async (id: string) => {
  let api = await prisma.api.findFirst({
    where: { id },
  });
  await prisma.api.delete({
    where: { id },
  });
  return api;
};

export const deleteGroup = async (id: string) => {
  let group = await prisma.group.findFirst({
    where: { id },
  });
  if (!group) {
    return null;
  }
  let project = await getProjectById(group.projectId);
  if (!project) {
    return null;
  }
  let groups: Group[] = [project.root];
  let target: Group | undefined;
  while (groups.length > 0) {
    let g = groups.pop();
    if (!g) {
      return null;
    }
    if (g.id === id) {
      target = g;
      break;
    } else {
      groups = groups.concat(g.groups);
    }
  }
  if (!target) {
    return null;
  }
  groups = [target];
  let groupsToDelete = [target.id];
  let apisToDelete: string[] = [];
  while (groups.length > 0) {
    let g = groups.pop();
    if (!g) {
      return null;
    }
    groups = groups.concat(g.groups);
    groupsToDelete = groupsToDelete.concat(g.groups.map((item) => item.id));
    apisToDelete = apisToDelete.concat(g.apis.map((item) => item.id));
  }

  await prisma.$transaction([
    prisma.group.deleteMany({
      where: {
        id: {
          in: groupsToDelete,
        },
      },
    }),
    prisma.api.deleteMany({
      where: {
        id: {
          in: apisToDelete,
        },
      },
    }),
  ]);

  return {
    group,
    groupsToDelete,
    apisToDelete,
  };
};
