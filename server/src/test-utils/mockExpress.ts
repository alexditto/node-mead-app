import type { NextFunction, Request, Response } from "express";

type MockSession = {
  userId?: number;
  destroy: jest.Mock;
};

type MockRequestOptions = {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  session?: Partial<MockSession>;
};

export function createMockRequest(options: MockRequestOptions = {}): Request {
  const session: MockSession = {
    userId: undefined,
    destroy: jest.fn((callback: (err?: unknown) => void) => callback()),
    ...options.session,
  };

  return {
    body: options.body ?? {},
    query: options.query ?? {},
    params: options.params ?? {},
    session,
  } as unknown as Request;
}

export function createMockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

export function createMockNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}
