import { RequestMethod } from '@prisma/client';
import { prisma } from './prisma.server';

export interface ApiData {
    name: string
    description?: string
    example?: string
    children: ApiData[]
}

export const createGroup = async ({ parentId, projectId, name }: {
    parentId?: string,
    projectId: string,
    name: string,
}) => {
    return prisma.group.create({
        data: {
            projectId: projectId,
            parentId: parentId,
            name: name,
        }
    })
}

export const updateGroup = async ({ id, name, description}: {
    id: string,
    name: string,
    description: string,
}) => {
   return prisma.group.update({
    where: {
        id: id,
    },
    data: {
        name, description,
    }
   }) 
}

export const getGroupById = async(id: string) => {
    let group = await prisma.group.findFirst({
        where: {
            id: id,
        }
    })
    if (!group) {
        return null
    }
    group.description ||= "";
    return group;
}

export const createApi = async(
    projectId: string,
    groupId: string | undefined,
    data: {name: string, path: string, method: RequestMethod}) => {
    let api = await prisma.api.create({
        data: {
            projectId: projectId,
            groupId: groupId,
            data: data,
        }
    })
    return api;
}