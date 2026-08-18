import { Router } from "express";
import * as batchController from "../controllers/batch.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, batchController.listBatches);
router.post("/", requireAuth, batchController.createBatch);

export default router;
