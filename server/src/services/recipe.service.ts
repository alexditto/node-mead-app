import { prisma } from "../lib/prisma";

export function listRecipes(userId?: number) {
  return prisma.recipe.findMany({
    where: {
      deletedAt: null,
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export function createRecipe(data: {
  userId: number;
  name: string;
  ingredients: string;
  imageUrl?: string;
}) {
  return prisma.recipe.create({ data });
}
