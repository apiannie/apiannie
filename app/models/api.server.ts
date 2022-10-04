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