import { mockPrisma } from "../test-utils/mockPrisma";

jest.mock("../lib/prisma", () => ({ prisma: mockPrisma }));

import { createBatch, listBatches } from "./batch.service";

describe("batch.service", () => {
  describe("listBatches", () => {
    it("filters by user only when no status is given", async () => {
      mockPrisma.batch.findMany.mockResolvedValue([]);

      await listBatches(7);

      expect(mockPrisma.batch.findMany).toHaveBeenCalledWith({
        where: { userId: 7 },
        include: { recipe: { select: { id: true, name: true } } },
        orderBy: { startDate: "desc" },
      });
    });

    it("includes the status filter when given", async () => {
      mockPrisma.batch.findMany.mockResolvedValue([]);

      await listBatches(7, "ACTIVE");

      expect(mockPrisma.batch.findMany).toHaveBeenCalledWith({
        where: { userId: 7, status: "ACTIVE" },
        include: { recipe: { select: { id: true, name: true } } },
        orderBy: { startDate: "desc" },
      });
    });
  });

  describe("createBatch", () => {
    it("returns null when the recipe doesn't belong to the user", async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      const result = await createBatch({ userId: 7, recipeId: 99, startDate: new Date("2026-01-01") });

      expect(mockPrisma.recipe.findFirst).toHaveBeenCalledWith({
        where: { id: 99, userId: 7, deletedAt: null },
      });
      expect(mockPrisma.batch.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("creates the batch when the recipe is owned by the user", async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue({ id: 3, userId: 7 });
      const created = { id: 1, userId: 7, recipeId: 3, status: "ACTIVE" };
      mockPrisma.batch.create.mockResolvedValue(created);

      const startDate = new Date("2026-01-01");
      const result = await createBatch({ userId: 7, recipeId: 3, startDate });

      expect(mockPrisma.batch.create).toHaveBeenCalledWith({
        data: { userId: 7, recipeId: 3, startDate },
        include: { recipe: { select: { id: true, name: true } } },
      });
      expect(result).toBe(created);
    });
  });
});
