import { createMockNext, createMockRequest, createMockResponse } from "../test-utils/mockExpress";
import { requireAuth } from "./requireAuth";

describe("requireAuth", () => {
  it("returns 401 and does not call next() when there is no session user", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() and does not respond when a session user is present", () => {
    const req = createMockRequest({ session: { userId: 1 } });
    const res = createMockResponse();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
