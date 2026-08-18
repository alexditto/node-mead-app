import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { prisma } from "./lib/prisma";
import recipeRoutes from "./routes/recipe.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

app.use("/api/recipes", recipeRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
