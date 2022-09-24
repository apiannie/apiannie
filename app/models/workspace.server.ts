import { User, Workspace } from "@prisma/client";
import { prisma } from "./prisma.server";

export const createWorkspace = async (user: User, workspaceName: Workspace["name"]) => {
    let workspace = await prisma.workspace.create({
        data: {
            name: workspaceName,
            users: [{
                id: user.id,
                name: user.name,
                role: "OWNER",
            }],
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
    let workspace = await prisma.workspace.findFirstOrThrow({
        where: {
            id: id,
        }
    })
    return workspace;
}