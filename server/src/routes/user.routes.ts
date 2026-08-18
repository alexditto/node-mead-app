import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.patch("/me", requireAuth, userController.updateName);
router.post("/me/password", requireAuth, userController.changePassword);
router.delete("/:id", requireAuth, userController.deleteUser);

export default router;
