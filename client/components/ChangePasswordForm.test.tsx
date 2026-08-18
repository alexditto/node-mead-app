import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useApi } from "@/hooks/useApi";
import { ChangePasswordForm } from "./ChangePasswordForm";

jest.mock("@/hooks/useApi", () => ({
  useApi: jest.fn(),
}));

const mockedUseApi = useApi as jest.Mock;

async function fillAndSubmit(current: string, next: string, confirm: string) {
  await userEvent.type(screen.getByLabelText("Current Password"), current);
  await userEvent.type(screen.getByLabelText("New Password"), next);
  await userEvent.type(screen.getByLabelText("Confirm New Password"), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Update Password" }));
}

describe("ChangePasswordForm", () => {
  it("requires all fields", async () => {
    const apiFetch = jest.fn();
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<ChangePasswordForm />);
    await userEvent.click(screen.getByRole("button", { name: "Update Password" }));

    expect(await screen.findByText("All fields are required")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("requires the new password to be at least 10 characters", async () => {
    const apiFetch = jest.fn();
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<ChangePasswordForm />);
    await fillAndSubmit("oldpassword1", "short", "short");

    expect(
      await screen.findByText("New password must be at least 10 characters"),
    ).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("requires the new password and confirmation to match", async () => {
    const apiFetch = jest.fn();
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<ChangePasswordForm />);
    await fillAndSubmit("oldpassword1", "newpassword123", "newpassword124");

    expect(await screen.findByText("New passwords do not match")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("submits, clears the fields, and shows a success message", async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<ChangePasswordForm />);
    await fillAndSubmit("oldpassword1", "newpassword123", "newpassword123");

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "oldpassword1", newPassword: "newpassword123" }),
      }),
    );

    expect(await screen.findByText("Password updated.")).toBeInTheDocument();
    expect(screen.getByLabelText("Current Password")).toHaveValue("");
    expect(screen.getByLabelText("New Password")).toHaveValue("");
  });

  it("shows the server's error message when the current password is wrong", async () => {
    const apiFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Current password is incorrect" }),
    });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<ChangePasswordForm />);
    await fillAndSubmit("wrongpassword", "newpassword123", "newpassword123");

    expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();
  });
});
