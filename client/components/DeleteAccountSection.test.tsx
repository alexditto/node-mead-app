import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { useApi } from "@/hooks/useApi";
import { DeleteAccountSection } from "./DeleteAccountSection";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/components/UserProvider", () => ({
  useUser: jest.fn(),
}));
jest.mock("@/hooks/useApi", () => ({
  useApi: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseUser = useUser as jest.Mock;
const mockedUseApi = useApi as jest.Mock;

describe("DeleteAccountSection", () => {
  const replace = jest.fn();
  const setUser = jest.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ replace });
    mockedUseUser.mockReturnValue({
      user: { id: 1, name: "Ada", email: "a@example.com", role: "user" },
      setUser,
    });
  });

  it("keeps the delete button disabled until the confirmation phrase is typed exactly", async () => {
    mockedUseApi.mockReturnValue({ apiFetch: jest.fn() });

    render(<DeleteAccountSection />);
    const button = screen.getByRole("button", { name: "Delete My Account" });
    const input = screen.getByLabelText("Confirmation");

    expect(button).toBeDisabled();

    await userEvent.type(input, "goodbye");
    expect(button).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, "good-bye");
    expect(button).toBeEnabled();
  });

  it("deletes the account, clears the user, and redirects on success", async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<DeleteAccountSection />);
    await userEvent.type(screen.getByLabelText("Confirmation"), "good-bye");
    await userEvent.click(screen.getByRole("button", { name: "Delete My Account" }));

    await waitFor(() => expect(setUser).toHaveBeenCalledWith(null));

    expect(apiFetch).toHaveBeenCalledWith("/api/users/1", { method: "DELETE" });
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("shows the server's error message and does not clear the user on failure", async () => {
    const apiFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Not authorized to delete this account" }),
    });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<DeleteAccountSection />);
    await userEvent.type(screen.getByLabelText("Confirmation"), "good-bye");
    await userEvent.click(screen.getByRole("button", { name: "Delete My Account" }));

    expect(await screen.findByText("Not authorized to delete this account")).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
