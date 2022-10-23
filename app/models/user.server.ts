import { User } from "@prisma/client";
import { prisma } from "./prisma.server";
import bcrypt from "bcryptjs";
export type { User };

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserInfoByIds(ids: string[]) {
  return prisma.user.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function createUser(
  email: User["email"],
  password: User["password"],
  name: User["name"]
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });
}

export async function verifyLogin(
  email: User["email"],
  password: User["password"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export const updateUserInfo = async (
  id: string,
  {
    name,
  }: {
    name?: string;
  }
) => {
  const result = await prisma.user.update({
    where: { id: id },
    data: {
      name: name,
    },
  });

  return result;
};

export const updatePassword = async (id: string, password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
};
