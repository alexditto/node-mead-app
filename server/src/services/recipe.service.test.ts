import { mockPrisma } from "../test-utils/mockPrisma";

jest.mock("../lib/prisma", () => ({ prisma: mockPrisma }));

import { createRecipe, listRecipes } from "./recipe.service";

describe("recipe.service", () => {
  describe("listRecipes", () => {
    it("scopes to the user and excludes soft-deleted recipes", async () => {
      const recipes = [{ id: 1, name: "Traditional Mead" }];
      mockPrisma.recipe.findMany.mockResolvedValue(recipes);

      const result = await listRecipes(7);

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
        where: { userId: 7, deletedAt: null },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toBe(recipes);
    });
  });

  describe("createRecipe", () => {
    it("passes the data straight through to prisma", async () => {
      const created = { id: 1, userId: 7, name: "Traditional Mead", ingredients: "honey, water, yeast" };
      mockPrisma.recipe.create.mockResolvedValue(created);

      const result = await createRecipe({
        userId: 7,
        name: "Traditional Mead",
        ingredients: "honey, water, yeast",
      });

      expect(mockPrisma.recipe.create).toHaveBeenCalledWith({
        data: { userId: 7, name: "Traditional Mead", ingredients: "honey, water, yeast" },
      });
      expect(result).toBe(created);
    });
  });
});
