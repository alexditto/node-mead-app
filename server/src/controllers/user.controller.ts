import { NextFunction, Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function updateName(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId as number;
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const user = await authService.updateName(userId, String(name).trim());
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId as number;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword are required" });
      return;
    }
    if (newPassword.length < 10) {
      res.status(400).json({ error: "New password must be at least 10 characters" });
      return;
    }

    const result = await authService.changePassword(userId, currentPassword, newPassword);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const targetId = Number(req.params.id);
    const requesterId = req.session.userId as number;

    if (Number.isNaN(targetId)) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    if (targetId !== requesterId) {
      const requester = await authService.findUserById(requesterId);
      if (!requester || requester.role !== "admin") {
        res.status(403).json({ error: "Not authorized to delete this account" });
        return;
      }
    }

    const deleted = await authService.softDeleteUser(targetId);
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (targetId === requesterId) {
      req.session.destroy((err) => {
        if (err) {
          next(err);
          return;
        }
        res.clearCookie("connect.sid");
        res.status(204).send();
      });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
