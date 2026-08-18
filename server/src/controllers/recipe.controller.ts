import { NextFunction, Request, Response } from "express";
import * as recipeService from "../services/recipe.service";

export async function listRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const recipes = await recipeService.listRecipes(userId);
    res.json(recipes);
  } catch (err) {
    next(err);
  }
}

export async function createRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, name, ingredients, imageUrl } = req.body;
    if (!userId || !name || !ingredients) {
      res.status(400).json({ error: "userId, name, and ingredients are required" });
      return;
    }
    const recipe = await recipeService.createRecipe({ userId, name, ingredients, imageUrl });
    res.status(201).json(recipe);
  } catch (err) {
    next(err);
  }
}
