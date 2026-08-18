import { Router } from "express";
import * as recipeController from "../controllers/recipe.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, recipeController.listRecipes);
router.post("/", requireAuth, recipeController.createRecipe);

export default router;
