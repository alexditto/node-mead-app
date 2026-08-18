import { Router } from "express";
import * as friendController from "../controllers/friend.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, friendController.listFriends);
router.post("/", requireAuth, friendController.sendRequest);
router.patch("/:id", requireAuth, friendController.respondToRequest);

export default router;
