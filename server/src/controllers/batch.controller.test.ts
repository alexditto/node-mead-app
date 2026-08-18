import * as batchService from "../services/batch.service";
import { createMockNext, createMockRequest, createMockResponse } from "../test-utils/mockExpress";
import { createBatch, listBatches } from "./batch.controller";

jest.mock("../services/batch.service");

const mockedBatchService = batchService as jest.Mocked<typeof batchService>;

describe("batch.controller", () => {
  describe("listBatches", () => {
    it("lists all batches for the session user when no status filter is given", async () => {
      const batches = [{ id: 1, status: "ACTIVE" }];
      mockedBatchService.listBatches.mockResolvedValue(batches as never);

      const req = createMockRequest({ session: { userId: 7 } });
      const res = createMockResponse();

      await listBatches(req, res, createMockNext());

      expect(mockedBatchService.listBatches).toHaveBeenCalledWith(7, undefined);
      expect(res.json).toHaveBeenCalledWith(batches);
    });

    it("passes a valid status filter through to the service", async () => {
      mockedBatchService.listBatches.mockResolvedValue([] as never);

      const req = createMockRequest({ session: { userId: 7 }, query: { status: "ACTIVE" } });
      const res = createMockResponse();

      await listBatches(req, res, createMockNext());

      expect(mockedBatchService.listBatches).toHaveBeenCalledWith(7, "ACTIVE");
    });

    it("returns 400 for an invalid status filter", async () => {
      const req = createMockRequest({ session: { userId: 7 }, query: { status: "NOT_REAL" } });
      const res = createMockResponse();

      await listBatches(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedBatchService.listBatches).not.toHaveBeenCalled();
    });
  });

  describe("createBatch", () => {
    it("returns 400 when recipeId or startDate is missing", async () => {
      const req = createMockRequest({ session: { userId: 7 }, body: { recipeId: 1 } });
      const res = createMockResponse();

      await createBatch(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedBatchService.createBatch).not.toHaveBeenCalled();
    });

    it("returns 404 when the recipe doesn't belong to the user", async () => {
      mockedBatchService.createBatch.mockResolvedValue(null);

      const req = createMockRequest({
        session: { userId: 7 },
        body: { recipeId: 999, startDate: "2026-01-01" },
      });
      const res = createMockResponse();

      await createBatch(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("creates the batch and returns 201 on success", async () => {
      const batch = { id: 1, userId: 7, recipeId: 3, status: "ACTIVE" };
      mockedBatchService.createBatch.mockResolvedValue(batch as never);

      const req = createMockRequest({
        session: { userId: 7 },
        body: { recipeId: 3, startDate: "2026-01-01" },
      });
      const res = createMockResponse();

      await createBatch(req, res, createMockNext());

      expect(mockedBatchService.createBatch).toHaveBeenCalledWith({
        userId: 7,
        recipeId: 3,
        startDate: new Date("2026-01-01"),
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(batch);
    });
  });
});
