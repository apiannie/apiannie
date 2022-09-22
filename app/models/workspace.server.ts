import { User, Workspace, WorkspaceUserRole } from "@prisma/client";
import { prisma } from "./prisma.server";


export async function getWorkspacesByUserId(userId: User["id"]) {
    // console.log(prisma);
    // return prisma.workspace.findMany({
    //     where: {
    //         memberIds: {
    //             has: userId,
    //         }
    //     }
    // });
    return [];
}

export async function createWorkspace(user: User, workspaceName: Workspace["name"]) {
    let workspace = await prisma.workspace.create({
        data: {
            name: workspaceName,
            users: [{
                id: user.id,
                name: user.name,
                role: "OWNER",
            }]
        }
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