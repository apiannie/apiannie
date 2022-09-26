import { User, Workspace } from "@prisma/client";
import { prisma } from "./prisma.server";

export const createWorkspace = async (user: User, workspaceName: Workspace["name"]) => {
    let workspace = await prisma.workspace.create({
        data: {
            name: workspaceName,
            owner: user.id,
        },
    })
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            workspaces: {
                push: {
                    id: workspace.id,
                    name: workspace.name,
                },
            }
        }
    })

    return workspace;
}

export const getWorkspaceById = async (id:string) => {
    let workspace = await prisma.workspace.findFirst({
        where: {
            id: id,
        }
    })
    return workspace;
}