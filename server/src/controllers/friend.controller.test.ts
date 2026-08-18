import * as friendService from "../services/friend.service";
import { createMockNext, createMockRequest, createMockResponse } from "../test-utils/mockExpress";
import { listFriends, respondToRequest, sendRequest } from "./friend.controller";

jest.mock("../services/friend.service");

const mockedFriendService = friendService as jest.Mocked<typeof friendService>;

describe("friend.controller", () => {
  describe("sendRequest", () => {
    it("returns 400 when identifier is missing", async () => {
      const req = createMockRequest({ session: { userId: 1 }, body: {} });
      const res = createMockResponse();

      await sendRequest(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedFriendService.findUserByIdentifier).not.toHaveBeenCalled();
    });

    it("returns 404 when no user matches", async () => {
      mockedFriendService.findUserByIdentifier.mockResolvedValue({ status: "not_found" });

      const req = createMockRequest({ session: { userId: 1 }, body: { identifier: "nobody" } });
      const res = createMockResponse();

      await sendRequest(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 409 when the name matches multiple users", async () => {
      mockedFriendService.findUserByIdentifier.mockResolvedValue({ status: "ambiguous" });

      const req = createMockRequest({ session: { userId: 1 }, body: { identifier: "SameName" } });
      const res = createMockResponse();

      await sendRequest(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("returns 400 when sending a request to yourself", async () => {
      mockedFriendService.findUserByIdentifier.mockResolvedValue({
        status: "found",
        user: { id: 1, name: "Me", email: "me@example.com" },
      });

      const req = createMockRequest({ session: { userId: 1 }, body: { identifier: "me@example.com" } });
      const res = createMockResponse();

      await sendRequest(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedFriendService.findExistingRelationship).not.toHaveBeenCalled();
    });

    it.each([
      ["ACCEPTED", "You're already friends"],
      ["PENDING", "A friend request is already pending"],
      ["REJECTED", "A previous request between you was rejected"],
    ])("returns 409 with the right message when a %s relationship exists", async (status, message) => {
      mockedFriendService.findUserByIdentifier.mockResolvedValue({
        status: "found",
        user: { id: 2, name: "Other", email: "other@example.com" },
      });
      mockedFriendService.findExistingRelationship.mockResolvedValue({
        id: 1,
        userId: 1,
        friendId: 2,
        status,
        acceptedAt: null,
        createdAt: new Date(),
      } as never);

      const req = createMockRequest({
        session: { userId: 1 },
        body: { identifier: "other@example.com" },
      });
      const res = createMockResponse();

      await sendRequest(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: message });
    });

    it("creates the request and returns 201 when nothing blocks it", async () => {
      mockedFriendService.findUserByIdentifier.mockResolvedValue({
        status: "found",
        user: { id: 2, name: "Other", email: "other@example.com" },
      });
      mockedFriendService.findExistingRelationship.mockResolvedValue(null);

      const req = createMockRequest({
        session: { userId: 1 },
        body: { identifier: "other@example.com" },
      });
      const res = createMockResponse();

      await sendRequest(req, res, createMockNext());

      expect(mockedFriendService.createRequest).toHaveBeenCalledWith(1, 2);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("listFriends", () => {
    it("returns the categorized data for the session user", async () => {
      const data = { friends: [], sentRequests: [], incomingRequests: [] };
      mockedFriendService.listFriendsData.mockResolvedValue(data);

      const req = createMockRequest({ session: { userId: 1 } });
      const res = createMockResponse();

      await listFriends(req, res, createMockNext());

      expect(mockedFriendService.listFriendsData).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(data);
    });
  });

  describe("respondToRequest", () => {
    it("returns 400 for an invalid action", async () => {
      const req = createMockRequest({
        session: { userId: 1 },
        params: { id: "5" },
        body: { action: "maybe" },
      });
      const res = createMockResponse();

      await respondToRequest(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedFriendService.respondToRequest).not.toHaveBeenCalled();
    });

    it("returns 400 for a non-numeric id", async () => {
      const req = createMockRequest({
        session: { userId: 1 },
        params: { id: "abc" },
        body: { action: "accept" },
      });
      const res = createMockResponse();

      await respondToRequest(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 404 when the service can't apply the response", async () => {
      mockedFriendService.respondToRequest.mockResolvedValue(null);

      const req = createMockRequest({
        session: { userId: 1 },
        params: { id: "5" },
        body: { action: "accept" },
      });
      const res = createMockResponse();

      await respondToRequest(req, res, createMockNext());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("accepts the request and returns success", async () => {
      mockedFriendService.respondToRequest.mockResolvedValue({ id: 5 } as never);

      const req = createMockRequest({
        session: { userId: 1 },
        params: { id: "5" },
        body: { action: "accept" },
      });
      const res = createMockResponse();

      await respondToRequest(req, res, createMockNext());

      expect(mockedFriendService.respondToRequest).toHaveBeenCalledWith(5, 1, true);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("rejects the request when action is reject", async () => {
      mockedFriendService.respondToRequest.mockResolvedValue({ id: 5 } as never);

      const req = createMockRequest({
        session: { userId: 1 },
        params: { id: "5" },
        body: { action: "reject" },
      });
      const res = createMockResponse();

      await respondToRequest(req, res, createMockNext());

      expect(mockedFriendService.respondToRequest).toHaveBeenCalledWith(5, 1, false);
    });
  });
});
