import { Router } from "express";
import * as recipeController from "../controllers/recipe.controller";

const router = Router();

router.get("/", recipeController.listRecipes);
router.post("/", recipeController.createRecipe);

export default router;
