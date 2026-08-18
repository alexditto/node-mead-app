import bcrypt from "bcryptjs";
import { mockPrisma } from "../test-utils/mockPrisma";

jest.mock("../lib/prisma", () => ({ prisma: mockPrisma }));
jest.mock("bcryptjs");

import {
  changePassword,
  createUser,
  findUserById,
  softDeleteUser,
  updateName,
  verifyCredentials,
} from "./auth.service";

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("auth.service", () => {
  describe("createUser", () => {
    it("hashes the password and creates the user with the public select", async () => {
      mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
      const created = { id: 1, name: "Ada", email: "a@example.com", role: "user" };
      mockPrisma.user.create.mockResolvedValue(created);

      const result = await createUser({ name: "Ada", email: "a@example.com", password: "correcthorsebattery" });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith("correcthorsebattery", 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { name: "Ada", email: "a@example.com", passwordHash: "hashed-password" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      expect(result).toBe(created);
    });
  });

  describe("verifyCredentials", () => {
    it("only looks up non-deleted users by email", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await verifyCredentials("a@example.com", "whatever");

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: "a@example.com", deletedAt: null },
      });
    });

    it("returns null when no user matches", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await verifyCredentials("a@example.com", "whatever");

      expect(result).toBeNull();
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it("returns null when the password doesn't match", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1, passwordHash: "hash" });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await verifyCredentials("a@example.com", "wrong");

      expect(result).toBeNull();
    });

    it("returns the user when the password matches", async () => {
      const user = { id: 1, passwordHash: "hash" };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await verifyCredentials("a@example.com", "correcthorsebattery");

      expect(mockedBcrypt.compare).toHaveBeenCalledWith("correcthorsebattery", "hash");
      expect(result).toBe(user);
    });
  });

  describe("findUserById", () => {
    it("only looks up non-deleted users, with the public select", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await findUserById(1);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
    });
  });

  describe("updateName", () => {
    it("updates the name and returns the public shape", async () => {
      const updated = { id: 1, name: "New Name" };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await updateName(1, "New Name");

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "New Name" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      expect(result).toBe(updated);
    });
  });

  describe("changePassword", () => {
    it("returns an error when the user doesn't exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await changePassword(1, "current", "newpassword123");

      expect(result).toEqual({ ok: false, error: "User not found" });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("returns an error when the current password is wrong", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, passwordHash: "hash" });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await changePassword(1, "wrong", "newpassword123");

      expect(result).toEqual({ ok: false, error: "Current password is incorrect" });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("hashes and saves the new password on success", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, passwordHash: "old-hash" });
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue("new-hash" as never);

      const result = await changePassword(1, "correct", "newpassword123");

      expect(mockedBcrypt.hash).toHaveBeenCalledWith("newpassword123", 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { passwordHash: "new-hash" },
      });
      expect(result).toEqual({ ok: true });
    });
  });

  describe("softDeleteUser", () => {
    it("returns true when a row was updated", async () => {
      mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });

      const result = await softDeleteUser(1);

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toBe(true);
    });

    it("returns false when no row was updated (not found or already deleted)", async () => {
      mockPrisma.user.updateMany.mockResolvedValue({ count: 0 });

      const result = await softDeleteUser(1);

      expect(result).toBe(false);
    });
  });
});
