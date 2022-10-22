import { PrismaClient } from "@prisma/client";

async function main() {
  let prisma = new PrismaClient();
  prisma.$connect();
}

main().then(() => console.log("Done seeding"));
