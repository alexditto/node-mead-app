import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const SALT_ROUNDS = 10;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} as const;

export function createUser(data: { name: string; email: string; password: string }) {
  return bcrypt.hash(data.password, SALT_ROUNDS).then((passwordHash) =>
    prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
      select: publicUserSelect,
    }),
  );
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

export function findUserById(id: number) {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}
