import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useApi } from "@/hooks/useApi";
import { SendFriendRequestForm } from "./SendFriendRequestForm";

jest.mock("@/hooks/useApi", () => ({
  useApi: jest.fn(),
}));

const mockedUseApi = useApi as jest.Mock;

describe("SendFriendRequestForm", () => {
  it("requires an identifier before submitting", async () => {
    const apiFetch = jest.fn();
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<SendFriendRequestForm onSent={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Send Request" }));

    expect(await screen.findByText("Enter an email or name")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("sends the request, clears the field, and calls onSent on success", async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    mockedUseApi.mockReturnValue({ apiFetch });
    const onSent = jest.fn();

    render(<SendFriendRequestForm onSent={onSent} />);

    const input = screen.getByLabelText("Email or Name");
    await userEvent.type(input, "friend@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send Request" }));

    await waitFor(() => expect(onSent).toHaveBeenCalled());

    expect(apiFetch).toHaveBeenCalledWith("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "friend@example.com" }),
    });
    expect(await screen.findByText("Friend request sent.")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("shows the server's error message on failure", async () => {
    const apiFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "No user found with that email or name" }),
    });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<SendFriendRequestForm onSent={jest.fn()} />);

    await userEvent.type(screen.getByLabelText("Email or Name"), "nobody@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send Request" }));

    expect(await screen.findByText("No user found with that email or name")).toBeInTheDocument();
  });
});
