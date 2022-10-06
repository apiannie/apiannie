import invariant from 'tiny-invariant';
import { User, Group as PrismaGroup, Api as PrismaApi } from '@prisma/client';
import { prisma } from './prisma.server';

export const createProject = async (user: User, workspaceId: string, name: string) => {
    let project = await prisma.project.create({
        data: {
            name: name,
            workspaceId: workspaceId,
        }
    })

    return project
}

export const getProjectsByWorkspaceId = async (workspaceId: string) => {
    let projects = await prisma.project.findMany({
        select: {
            id: true,
            name: true,
        },
        where: {
            workspaceId: workspaceId,
        }
    })
    return projects;
}

export const getProjectsByWorkspaceIds = async (workspaceIds: string[]) => {
    let projects = await prisma.project.findMany({
        select: {
            id: true,
            name: true,
            workspaceId: true,
        },
        where: {
            workspaceId: {
                in: workspaceIds
            },
        },
    })
    return projects;
}

export const getProjectById = async (id: string) => {
    let project = await prisma.project.findFirst({
        where: {
            id: id,
        },
        include: {
            groups: {
                select: {
                    id: true, name: true, parentId: true,
                }
            },
            apis: {
                select: {
                    id: true, groupId: true, data: {
                        select: {
                            name: true, method: true, path: true,
                        }
                    }
                }
            },
        }
    })

    if (!project) {
        return null;
    }

    type Api = typeof project.apis[0]
    type PlainGroup = typeof project.groups[0]
    type Group = PlainGroup & {
        apis: Api[],
        groups: Group[], 
    }

    let groupMap = new Map<string, Group>();
    let apiMap = new Map<string, Api>();
    let groups = project.groups.map(group => ({
        ...group,
        apis: new Array(),
        groups: new Array()
    }));

    let root: Group = {
        id: "",
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
            let parent = groupMap.get(group.parentId)
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

    let { apis, groups: _, ...rest} = project;
    return {
        ...rest,
        root: root,
    };
}

export type Project = Awaited<ReturnType<typeof getProjectById>>
export type Api = NonNullable<Project>["root"]["apis"][0]
export type Group = NonNullable<Project>["root"]["groups"][0] 