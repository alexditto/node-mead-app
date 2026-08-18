import * as authService from "../services/auth.service";
import { createMockNext, createMockRequest, createMockResponse } from "../test-utils/mockExpress";
import { changePassword, deleteUser, updateName } from "./user.controller";

jest.mock("../services/auth.service");

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe("user.controller", () => {
  describe("updateName", () => {
    it("returns 400 when name is missing or blank", async () => {
      const req = createMockRequest({ session: { userId: 1 }, body: { name: "   " } });
      const res = createMockResponse();

      await updateName(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedAuthService.updateName).not.toHaveBeenCalled();
    });

    it("trims the name, updates it, and returns the user", async () => {
      const user = { id: 1, name: "Ada", email: "a@example.com", role: "user", createdAt: new Date() };
      mockedAuthService.updateName.mockResolvedValue(user as never);

      const req = createMockRequest({ session: { userId: 1 }, body: { name: "  Ada  " } });
      const res = createMockResponse();

      await updateName(req, res, createMockNext());

      expect(mockedAuthService.updateName).toHaveBeenCalledWith(1, "Ada");
      expect(res.json).toHaveBeenCalledWith({ user });
    });
  });

  describe("changePassword", () => {
    it("returns 400 when fields are missing", async () => {
      const req = createMockRequest({ session: { userId: 1 }, body: { currentPassword: "x" } });
      const res = createMockResponse();

      await changePassword(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedAuthService.changePassword).not.toHaveBeenCalled();
    });

    it("returns 400 when the new password is too short", async () => {
      const req = createMockRequest({
        session: { userId: 1 },
        body: { currentPassword: "correcthorsebattery", newPassword: "short" },
      });
      const res = createMockResponse();

      await changePassword(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedAuthService.changePassword).not.toHaveBeenCalled();
    });

    it("returns 400 with the service's error when the current password is wrong", async () => {
      mockedAuthService.changePassword.mockResolvedValue({
        ok: false,
        error: "Current password is incorrect",
      });

      const req = createMockRequest({
        session: { userId: 1 },
        body: { currentPassword: "wrongpassword1", newPassword: "newpassword123" },
      });
      const res = createMockResponse();

      await changePassword(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Current password is incorrect" });
    });

    it("returns 204 on success", async () => {
      mockedAuthService.changePassword.mockResolvedValue({ ok: true });

      const req = createMockRequest({
        session: { userId: 1 },
        body: { currentPassword: "correcthorsebattery", newPassword: "newpassword123" },
      });
      const res = createMockResponse();

      await changePassword(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("deleteUser", () => {
    it("returns 400 for a non-numeric id", async () => {
      const req = createMockRequest({ session: { userId: 1 }, params: { id: "abc" } });
      const res = createMockResponse();

      await deleteUser(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 403 when deleting someone else's account without being an admin", async () => {
      mockedAuthService.findUserById.mockResolvedValue({
        id: 1,
        name: "Me",
        email: "me@example.com",
        role: "user",
        createdAt: new Date(),
      } as never);

      const req = createMockRequest({ session: { userId: 1 }, params: { id: "2" } });
      const res = createMockResponse();

      await deleteUser(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockedAuthService.softDeleteUser).not.toHaveBeenCalled();
    });

    it("allows an admin to delete someone else's account", async () => {
      mockedAuthService.findUserById.mockResolvedValue({
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
        createdAt: new Date(),
      } as never);
      mockedAuthService.softDeleteUser.mockResolvedValue(true);

      const req = createMockRequest({ session: { userId: 1 }, params: { id: "2" } });
      const res = createMockResponse();

      await deleteUser(req, res, createMockNext());

      expect(mockedAuthService.softDeleteUser).toHaveBeenCalledWith(2);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(req.session.destroy).not.toHaveBeenCalled();
    });

    it("returns 404 when the target user doesn't exist or is already deleted", async () => {
      mockedAuthService.softDeleteUser.mockResolvedValue(false);

      const req = createMockRequest({ session: { userId: 1 }, params: { id: "1" } });
      const res = createMockResponse();

      await deleteUser(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("destroys the session and clears the cookie on self-delete", async () => {
      mockedAuthService.softDeleteUser.mockResolvedValue(true);

      const req = createMockRequest({ session: { userId: 1 }, params: { id: "1" } });
      const res = createMockResponse();

      await deleteUser(req, res, createMockNext());

      expect(mockedAuthService.findUserById).not.toHaveBeenCalled();
      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith("connect.sid");
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
