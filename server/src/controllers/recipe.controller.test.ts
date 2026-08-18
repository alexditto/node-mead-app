import * as recipeService from "../services/recipe.service";
import { createMockNext, createMockRequest, createMockResponse } from "../test-utils/mockExpress";
import { createRecipe, listRecipes } from "./recipe.controller";

jest.mock("../services/recipe.service");

const mockedRecipeService = recipeService as jest.Mocked<typeof recipeService>;

describe("recipe.controller", () => {
  describe("listRecipes", () => {
    it("lists recipes scoped to the session user", async () => {
      const recipes = [{ id: 1, name: "Traditional Mead" }];
      mockedRecipeService.listRecipes.mockResolvedValue(recipes as never);

      const req = createMockRequest({ session: { userId: 7 } });
      const res = createMockResponse();

      await listRecipes(req, res, createMockNext());

      expect(mockedRecipeService.listRecipes).toHaveBeenCalledWith(7);
      expect(res.json).toHaveBeenCalledWith(recipes);
    });

    it("forwards errors to next()", async () => {
      const error = new Error("db down");
      mockedRecipeService.listRecipes.mockRejectedValue(error);

      const req = createMockRequest({ session: { userId: 7 } });
      const res = createMockResponse();
      const next = createMockNext();

      await listRecipes(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("createRecipe", () => {
    it("returns 400 when name or ingredients is missing", async () => {
      const req = createMockRequest({ session: { userId: 7 }, body: { name: "Only Name" } });
      const res = createMockResponse();

      await createRecipe(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedRecipeService.createRecipe).not.toHaveBeenCalled();
    });

    it("creates the recipe scoped to the session user and returns 201", async () => {
      const recipe = { id: 1, userId: 7, name: "Traditional Mead", ingredients: "honey, water, yeast" };
      mockedRecipeService.createRecipe.mockResolvedValue(recipe as never);

      const req = createMockRequest({
        session: { userId: 7 },
        body: { name: "Traditional Mead", ingredients: "honey, water, yeast" },
      });
      const res = createMockResponse();

      await createRecipe(req, res, createMockNext());

      expect(mockedRecipeService.createRecipe).toHaveBeenCalledWith({
        userId: 7,
        name: "Traditional Mead",
        ingredients: "honey, water, yeast",
        imageUrl: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(recipe);
    });
  });
});
