import { mockPrisma } from "../test-utils/mockPrisma";

jest.mock("../lib/prisma", () => ({ prisma: mockPrisma }));

import {
  createRequest,
  findExistingRelationship,
  findUserByIdentifier,
  listFriendsData,
  respondToRequest,
} from "./friend.service";

describe("friend.service", () => {
  describe("findUserByIdentifier", () => {
    it("returns not_found for a blank identifier without querying", async () => {
      const result = await findUserByIdentifier("   ");

      expect(result).toEqual({ status: "not_found" });
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    });

    it("returns found when an email matches", async () => {
      const user = { id: 1, name: "Ada", email: "a@example.com" };
      mockPrisma.user.findFirst.mockResolvedValue(user);

      const result = await findUserByIdentifier("a@example.com");

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: "a@example.com", deletedAt: null },
        select: { id: true, name: true, email: true },
      });
      expect(result).toEqual({ status: "found", user });
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });

    it("falls back to name lookup and returns found for a single match", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      const user = { id: 2, name: "Unique Name", email: "u@example.com" };
      mockPrisma.user.findMany.mockResolvedValue([user]);

      const result = await findUserByIdentifier("Unique Name");

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { name: "Unique Name", deletedAt: null },
        select: { id: true, name: true, email: true },
        take: 2,
      });
      expect(result).toEqual({ status: "found", user });
    });

    it("returns ambiguous when multiple users share a name", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 2, name: "Same", email: "b@example.com" },
        { id: 3, name: "Same", email: "c@example.com" },
      ]);

      const result = await findUserByIdentifier("Same");

      expect(result).toEqual({ status: "ambiguous" });
    });

    it("returns not_found when nothing matches by email or name", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await findUserByIdentifier("nobody");

      expect(result).toEqual({ status: "not_found" });
    });
  });

  describe("findExistingRelationship", () => {
    it("checks both directions between the two users", async () => {
      mockPrisma.friend.findFirst.mockResolvedValue(null);

      await findExistingRelationship(1, 2);

      expect(mockPrisma.friend.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: 1, friendId: 2 },
            { userId: 2, friendId: 1 },
          ],
        },
      });
    });
  });

  describe("createRequest", () => {
    it("creates a pending request", async () => {
      await createRequest(1, 2);

      expect(mockPrisma.friend.create).toHaveBeenCalledWith({
        data: { userId: 1, friendId: 2, status: "PENDING" },
      });
    });
  });

  describe("listFriendsData", () => {
    it("categorizes relationships relative to the given user", async () => {
      const acceptedAt = new Date("2026-01-01");
      const createdAt = new Date("2026-02-01");

      mockPrisma.friend.findMany.mockResolvedValue([
        // I (1) sent this and it was accepted -> friend, other user is the "friend" record
        {
          id: 1,
          userId: 1,
          friendId: 2,
          status: "ACCEPTED",
          acceptedAt,
          createdAt,
          user: { id: 1, name: "Me" },
          friend: { id: 2, name: "Accepted Friend" },
        },
        // I (1) sent this, still pending -> sentRequests
        {
          id: 2,
          userId: 1,
          friendId: 3,
          status: "PENDING",
          acceptedAt: null,
          createdAt,
          user: { id: 1, name: "Me" },
          friend: { id: 3, name: "Pending Target" },
        },
        // Someone else (4) sent this to me -> incomingRequests, other user is the "user" record
        {
          id: 3,
          userId: 4,
          friendId: 1,
          status: "PENDING",
          acceptedAt: null,
          createdAt,
          user: { id: 4, name: "Incoming Sender" },
          friend: { id: 1, name: "Me" },
        },
        // A rejected relationship should appear in none of the buckets
        {
          id: 4,
          userId: 1,
          friendId: 5,
          status: "REJECTED",
          acceptedAt: null,
          createdAt,
          user: { id: 1, name: "Me" },
          friend: { id: 5, name: "Rejected Target" },
        },
      ]);

      const result = await listFriendsData(1);

      expect(mockPrisma.friend.findMany).toHaveBeenCalledWith({
        where: { OR: [{ userId: 1 }, { friendId: 1 }] },
        include: {
          user: { select: { id: true, name: true, email: true } },
          friend: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      expect(result.friends).toEqual([
        { id: 1, user: { id: 2, name: "Accepted Friend" }, acceptedAt },
      ]);
      expect(result.sentRequests).toEqual([
        { id: 2, user: { id: 3, name: "Pending Target" }, createdAt },
      ]);
      expect(result.incomingRequests).toEqual([
        { id: 3, user: { id: 4, name: "Incoming Sender" }, createdAt },
      ]);
    });
  });

  describe("respondToRequest", () => {
    it("returns null when the request doesn't exist", async () => {
      mockPrisma.friend.findUnique.mockResolvedValue(null);

      const result = await respondToRequest(1, 2, true);

      expect(result).toBeNull();
      expect(mockPrisma.friend.update).not.toHaveBeenCalled();
    });

    it("returns null when the responding user isn't the recipient", async () => {
      mockPrisma.friend.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
        friendId: 2,
        status: "PENDING",
      });

      const result = await respondToRequest(1, 99, true);

      expect(result).toBeNull();
      expect(mockPrisma.friend.update).not.toHaveBeenCalled();
    });

    it("returns null when the request isn't pending", async () => {
      mockPrisma.friend.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
        friendId: 2,
        status: "ACCEPTED",
      });

      const result = await respondToRequest(1, 2, true);

      expect(result).toBeNull();
    });

    it("accepts a pending request and sets acceptedAt", async () => {
      mockPrisma.friend.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
        friendId: 2,
        status: "PENDING",
      });
      mockPrisma.friend.update.mockResolvedValue({ id: 1, status: "ACCEPTED" });

      await respondToRequest(1, 2, true);

      expect(mockPrisma.friend.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "ACCEPTED", acceptedAt: expect.any(Date) },
      });
    });

    it("rejects a pending request with a null acceptedAt", async () => {
      mockPrisma.friend.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
        friendId: 2,
        status: "PENDING",
      });
      mockPrisma.friend.update.mockResolvedValue({ id: 1, status: "REJECTED" });

      await respondToRequest(1, 2, false);

      expect(mockPrisma.friend.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "REJECTED", acceptedAt: null },
      });
    });
  });
});
