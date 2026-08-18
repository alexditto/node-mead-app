import { BatchStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import * as batchService from "../services/batch.service";

const VALID_STATUSES = new Set<string>(Object.values(BatchStatus));

export async function listBatches(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId as number;
    const statusParam = req.query.status;

    let status: BatchStatus | undefined;
    if (typeof statusParam === "string" && statusParam.length > 0) {
      if (!VALID_STATUSES.has(statusParam)) {
        res.status(400).json({ error: "Invalid status filter" });
        return;
      }
      status = statusParam as BatchStatus;
    }

    const batches = await batchService.listBatches(userId, status);
    res.json(batches);
  } catch (err) {
    next(err);
  }
}

export async function createBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId as number;
    const { recipeId, startDate } = req.body;

    if (!recipeId || !startDate) {
      res.status(400).json({ error: "recipeId and startDate are required" });
      return;
    }

    const batch = await batchService.createBatch({
      userId,
      recipeId: Number(recipeId),
      startDate: new Date(startDate),
    });

    if (!batch) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.status(201).json(batch);
  } catch (err) {
    next(err);
  }
}
