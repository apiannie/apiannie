import { User } from "@prisma/client";
import { prisma } from "./prisma.server";


export async function getWorkspacesByUserId(userId: User["id"]) {
    // console.log(prisma);
    return prisma.workspace.findMany({
        where: {
            memberIds: {
                has: userId,
            }
        }
    });
}