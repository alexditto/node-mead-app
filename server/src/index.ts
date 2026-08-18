import cors from "cors";
import express from "express";
import session from "express-session";
import { errorHandler } from "./middleware/errorHandler";
import { prisma } from "./lib/prisma";
import { sessionStore } from "./lib/sessionStore";
import authRoutes from "./routes/auth.routes";
import batchRoutes from "./routes/batch.routes";
import friendRoutes from "./routes/friend.routes";
import recipeRoutes from "./routes/recipe.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
