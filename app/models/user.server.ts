import { User } from "@prisma/client";
import { prisma } from "./prisma.server";

export type { User };

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}
