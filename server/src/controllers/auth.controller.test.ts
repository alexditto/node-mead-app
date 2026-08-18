import { Prisma } from "@prisma/client";
import * as authService from "../services/auth.service";
import { createMockNext, createMockRequest, createMockResponse } from "../test-utils/mockExpress";
import { login, logout, me, register } from "./auth.controller";

jest.mock("../services/auth.service");

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe("auth.controller", () => {
  describe("register", () => {
    it("returns 400 when required fields are missing", async () => {
      const req = createMockRequest({ body: { email: "a@example.com" } });
      const res = createMockResponse();

      await register(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedAuthService.createUser).not.toHaveBeenCalled();
    });

    it("returns 400 when password is shorter than 10 characters", async () => {
      const req = createMockRequest({
        body: { name: "Ada", email: "a@example.com", password: "short" },
      });
      const res = createMockResponse();

      await register(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedAuthService.createUser).not.toHaveBeenCalled();
    });

    it("creates the user, sets the session, and returns 201", async () => {
      const user = {
        id: 1,
        name: "Ada",
        email: "a@example.com",
        role: "user",
        createdAt: new Date(),
      };
      mockedAuthService.createUser.mockResolvedValue(user as never);

      const req = createMockRequest({
        body: { name: "Ada", email: "a@example.com", password: "correcthorsebattery" },
      });
      const res = createMockResponse();

      await register(req, res, createMockNext());

      expect(mockedAuthService.createUser).toHaveBeenCalledWith({
        name: "Ada",
        email: "a@example.com",
        password: "correcthorsebattery",
      });
      expect(req.session.userId).toBe(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ user });
    });

    it("returns 409 when the email is already registered", async () => {
      const error = new Prisma.PrismaClientKnownRequestError("Duplicate entry", {
        code: "P2002",
        clientVersion: "5.22.0",
      });
      mockedAuthService.createUser.mockRejectedValue(error);

      const req = createMockRequest({
        body: { name: "Ada", email: "a@example.com", password: "correcthorsebattery" },
      });
      const res = createMockResponse();

      await register(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("forwards unexpected errors to next()", async () => {
      const error = new Error("boom");
      mockedAuthService.createUser.mockRejectedValue(error);

      const req = createMockRequest({
        body: { name: "Ada", email: "a@example.com", password: "correcthorsebattery" },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("login", () => {
    it("returns 400 when email or password is missing", async () => {
      const req = createMockRequest({ body: { email: "a@example.com" } });
      const res = createMockResponse();

      await login(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedAuthService.verifyCredentials).not.toHaveBeenCalled();
    });

    it("returns 401 for invalid credentials", async () => {
      mockedAuthService.verifyCredentials.mockResolvedValue(null);

      const req = createMockRequest({ body: { email: "a@example.com", password: "wrong" } });
      const res = createMockResponse();

      await login(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("sets the session and returns the public user shape on success", async () => {
      const user = {
        id: 2,
        name: "Ada",
        email: "a@example.com",
        role: "user",
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockedAuthService.verifyCredentials.mockResolvedValue(user as never);

      const req = createMockRequest({
        body: { email: "a@example.com", password: "correcthorsebattery" },
      });
      const res = createMockResponse();

      await login(req, res, createMockNext());

      expect(req.session.userId).toBe(2);
      expect(res.json).toHaveBeenCalledWith({
        user: {
          id: 2,
          name: "Ada",
          email: "a@example.com",
          role: "user",
          createdAt: user.createdAt,
        },
      });
    });
  });

  describe("logout", () => {
    it("destroys the session, clears the cookie, and returns 204", () => {
      const req = createMockRequest();
      const res = createMockResponse();

      logout(req, res, createMockNext());

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith("connect.sid");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("forwards session-destroy errors to next()", () => {
      const error = new Error("session store down");
      const req = createMockRequest({
        session: { destroy: jest.fn((callback: (err?: unknown) => void) => callback(error)) },
      });
      const res = createMockResponse();
      const next = createMockNext();

      logout(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("me", () => {
    it("returns 401 when there is no matching user", async () => {
      mockedAuthService.findUserById.mockResolvedValue(null);

      const req = createMockRequest({ session: { userId: 99 } });
      const res = createMockResponse();

      await me(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns the current user on success", async () => {
      const user = { id: 1, name: "Ada", email: "a@example.com", role: "user", createdAt: new Date() };
      mockedAuthService.findUserById.mockResolvedValue(user as never);

      const req = createMockRequest({ session: { userId: 1 } });
      const res = createMockResponse();

      await me(req, res, createMockNext());

      expect(mockedAuthService.findUserById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ user });
    });
  });
});
