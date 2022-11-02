import { ProjectUserRole, User } from "@prisma/client";
import invariant from "tiny-invariant";
import { checkRole } from "~/utils";
import { prisma } from "./prisma.server";

export const createProject = async (user: User, name: string) => {
  let project = await prisma.project.create({
    data: {
      name: name,
      members: {
        id: user.id,
        role: ProjectUserRole.ADMIN,
      },
    },
  });
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      projectIds: {
        push: project.id,
      },
    },
  });
  return project;
};

export const getProjectByIds = async (ids: string[]) => {
  let projects = await prisma.project.findMany({
    where: {
      id: {
        in: ids,
      },
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      members: true,
      apis: {
        select: { id: true },
      },
    },
  });
  return projects;
};

const findProjectById = async (id: string) => {
  let project = await prisma.project.findFirst({
    where: {
      id: id,
      isDeleted: false,
    },
    include: {
      groups: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },
      apis: {
        select: {
          id: true,
          groupId: true,
          data: {
            select: {
              name: true,
              method: true,
              path: true,
            },
          },
        },
      },
    },
  });

  return project;
};

export type Api = NonNullable<
  Awaited<ReturnType<typeof findProjectById>>
>["apis"][0];
export type PlainGroup = NonNullable<
  Awaited<ReturnType<typeof findProjectById>>
>["groups"][0];
export type Group = PlainGroup & {
  apis: Api[];
  groups: Group[];
};

export const getProjectById = async (id: string) => {
  let project = await findProjectById(id);

  if (!project) {
    return null;
  }

  let groupMap = new Map<string, Group>();
  let groups = project.groups.map((group) => ({
    ...group,
    apis: new Array(),
    groups: new Array(),
  }));

  let root: Group = {
    id: "root",
    name: "root",
    parentId: null,
    apis: [],
    groups: [],
  };

  for (let group of groups) {
    groupMap.set(group.id, group);
  }
  for (let group of groups) {
    if (group.parentId) {
      let parent = groupMap.get(group.parentId);
      invariant(parent, "parent is null");
      parent.groups.push(group);
    } else {
      root.groups.push(group);
    }
  }
  for (let api of project.apis) {
    if (api.groupId) {
      let group = groupMap.get(api.groupId);
      // TODO: add warning log
      group?.apis.push(api);
    } else {
      root.apis.push(api);
    }
  }

  let { apis, groups: _, ...rest } = project;
  return {
    ...rest,
    root: root,
  };
};

export type Project = NonNullable<Awaited<ReturnType<typeof getProjectById>>>;

export const updateProject = async (
  id: string,
  data: { name?: string; isDeleted?: boolean }
) => {
  return await prisma.project.update({
    where: { id: id },
    data: data,
  });
};

export const addMemberToProject = async (
  projectId: string,
  userId: string,
  role: ProjectUserRole
) => {
  return await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          push: {
            id: userId,
            role: role,
          },
        },
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        projectIds: {
          push: projectId,
        },
      },
    }),
  ]);
};

export const findProjectMembersById = async (id: string) => {
  let project = await prisma.project.findFirst({
    where: {
      id: id,
    },
    select: {
      id: true,
      name: true,
      members: true,
    },
  });

  return project;
};

export const transferProject = async (
  project: NonNullable<Awaited<ReturnType<typeof findProjectMembersById>>>,
  transferUser: User,
  currentUser: User
) => {
  const transaction = [
    prisma.project.update({
      where: { id: project.id },
      data: {
        members: {
          deleteMany: {
            where: { id: currentUser.id },
          },
        },
      },
    }),
    prisma.user.update({
      where: { id: currentUser.id },
      data: {
        projectIds: currentUser.projectIds.filter((id) => id !== project.id),
      },
    }),
  ];
  if (project.members.every((member) => member.id !== transferUser.id)) {
    transaction.push(
      prisma.project.update({
        where: { id: project.id },
        data: {
          members: {
            push: {
              id: transferUser.id,
              role: ProjectUserRole.ADMIN,
            },
          },
        },
      })
    );
  }
  if (!transferUser.projectIds.includes(project.id)) {
    transaction.push(
      prisma.user.update({
        where: { id: transferUser.id },
        data: {
          projectIds: {
            push: project.id,
          },
        },
      })
    );
  }
  return await prisma.$transaction(transaction);
};

export const checkAuthority = async (
  userId: string,
  projectId: string,
  requiredRole: ProjectUserRole
) => {
  let project = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      members: true,
    },
  });

  if (!project) {
    return false;
  }

  let memberRole = project?.members.find(
    (member) => member.id === userId
  )?.role;

  if (!memberRole) {
    return false;
  }

  return checkRole(memberRole, requiredRole);
};

export const changeProjectRole = async (
  projectId: string,
  userId: string,
  role: ProjectUserRole
) => {
  return await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      members: {
        updateMany: {
          where: {
            id: userId,
          },
          data: {
            role: role,
          },
        },
      },
    },
  });
};
