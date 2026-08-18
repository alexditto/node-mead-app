import { BatchStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const recipeSelect = { id: true, name: true } as const;

export function listBatches(userId: number, status?: BatchStatus) {
  return prisma.batch.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    include: { recipe: { select: recipeSelect } },
    orderBy: { startDate: "desc" },
  });
}

export async function createBatch(data: {
  userId: number;
  recipeId: number;
  startDate: Date;
}) {
  const recipe = await prisma.recipe.findFirst({
    where: { id: data.recipeId, userId: data.userId, deletedAt: null },
  });
  if (!recipe) {
    return null;
  }

  return prisma.batch.create({
    data: {
      userId: data.userId,
      recipeId: data.recipeId,
      startDate: data.startDate,
    },
    include: { recipe: { select: recipeSelect } },
  });
}
