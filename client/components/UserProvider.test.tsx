import { act, renderHook, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { UserProvider, useUser } from "./UserProvider";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;

function wrapper({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

describe("UserProvider", () => {
  const replace = jest.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ replace });
    global.fetch = jest.fn();
  });

  it("starts loading, then populates the user on a successful /me fetch", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 1, name: "Ada", email: "a@example.com", role: "user" } }),
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual({
      id: 1,
      name: "Ada",
      email: "a@example.com",
      role: "user",
    });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/auth/me"), {
      credentials: "include",
    });
  });

  it("leaves the user null when the /me fetch is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it("logout clears the user and redirects to /login", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 1, name: "Ada", email: "a@example.com", role: "user" } }),
    });

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("throws when useUser is called outside a UserProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useUser())).toThrow(
      "useUser must be used within a UserProvider",
    );

    consoleSpy.mockRestore();
  });
});
