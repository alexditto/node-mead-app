import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const SALT_ROUNDS = 10;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
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
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

export function findUserById(id: number) {
  return prisma.user.findFirst({ where: { id, deletedAt: null }, select: publicUserSelect });
}

export function updateName(id: number, name: string) {
  return prisma.user.update({
    where: { id },
    data: { name },
    select: publicUserSelect,
  });
}

export async function changePassword(id: number, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return { ok: false as const, error: "User not found" };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false as const, error: "Current password is incorrect" };
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  return { ok: true as const };
}

export async function softDeleteUser(id: number) {
  const result = await prisma.user.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
