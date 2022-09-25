import { ProjectUser, Workspace } from '@prisma/client';
import { User } from '@prisma/client';
import { prisma } from './prisma.server';

export const createProject = async (user: User, workspaceId: string, name: string, users: ProjectUser[]) => {
    let project = await prisma.project.create({
        data: {
            name: name,
            workspaceId: workspaceId,
            users: users,
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