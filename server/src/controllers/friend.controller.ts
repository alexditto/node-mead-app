import { NextFunction, Request, Response } from "express";
import * as friendService from "../services/friend.service";

export async function sendRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId as number;
    const { identifier } = req.body;

    if (!identifier || !String(identifier).trim()) {
      res.status(400).json({ error: "Enter an email or name to send a request" });
      return;
    }

    const lookup = await friendService.findUserByIdentifier(String(identifier));
    if (lookup.status === "not_found") {
      res.status(404).json({ error: "No user found with that email or name" });
      return;
    }
    if (lookup.status === "ambiguous") {
      res
        .status(409)
        .json({ error: "Multiple users match that name — try searching by email instead" });
      return;
    }

    const targetUser = lookup.user;
    if (targetUser.id === userId) {
      res.status(400).json({ error: "You can't send a friend request to yourself" });
      return;
    }

    const existing = await friendService.findExistingRelationship(userId, targetUser.id);
    if (existing) {
      const message =
        existing.status === "ACCEPTED"
          ? "You're already friends"
          : existing.status === "PENDING"
            ? "A friend request is already pending"
            : "A previous request between you was rejected";
      res.status(409).json({ error: message });
      return;
    }

    await friendService.createRequest(userId, targetUser.id);
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function listFriends(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId as number;
    const data = await friendService.listFriendsData(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function respondToRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId as number;
    const requestId = Number(req.params.id);
    const { action } = req.body;

    if (Number.isNaN(requestId) || (action !== "accept" && action !== "reject")) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const updated = await friendService.respondToRequest(requestId, userId, action === "accept");
    if (!updated) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
