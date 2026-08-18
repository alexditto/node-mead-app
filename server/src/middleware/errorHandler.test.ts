import { createMockNext, createMockRequest, createMockResponse } from "../test-utils/mockExpress";
import { errorHandler } from "./errorHandler";

describe("errorHandler", () => {
  it("logs the error and responds with a generic 500", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("something broke");
    const req = createMockRequest();
    const res = createMockResponse();

    errorHandler(error, req, res, createMockNext());

    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });

    consoleSpy.mockRestore();
  });
});
