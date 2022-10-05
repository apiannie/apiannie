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


export interface Api  {
    id: string;
    name: string;
    groupId: string | null; 
}

export interface Group {
    id: string;
    name: string;
    parentId: string | null; 
    apis: Api[]
    groups: Group[]
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
                    id: true, name: true, groupId: true,
                }
            },
        }
    })

    if (!project) {
        return null;
    }

    let groupMap = new Map<string, Group>();
    let groups = project.groups.map(group => ({
        ...group,
        apis: new Array<Api>(),
        groups: new Array<Group>()
    }));

    let root: {
        apis: Api[],
        groups: Group[]
    } = {
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