import "dotenv/config";

import {
  UserRole,
} from "../src/generated/prisma/client";

import { prisma } from "../src/server/db/prisma";

const PHONE = "09109393315";

async function main() {
  let user =
    await prisma.user.findUnique({
      where: {
        phoneNumber: PHONE,
      },
    });

  if (!user) {
    user =
      await prisma.user.create({
        data: {
          phoneNumber: PHONE,
          fullName: "Funima Admin",
          roles: [
            UserRole.ADMIN,
          ],
        },
      });

    console.log(
      "ADMIN user created:",
      {
        id: user.id,
        phoneNumber:
          user.phoneNumber,
        roles:
          user.roles,
      },
    );

    return;
  }

  if (
    user.roles.includes(
      UserRole.ADMIN,
    )
  ) {
    console.log(
      "User is already ADMIN",
    );

    return;
  }

  const updated =
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        roles: {
          push:
            UserRole.ADMIN,
        },
      },

      select: {
        id: true,
        phoneNumber: true,
        roles: true,
      },
    });

  console.log(
    "ADMIN role added:",
    updated,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });