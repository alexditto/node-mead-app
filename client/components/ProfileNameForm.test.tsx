import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useUser } from "@/components/UserProvider";
import { useApi } from "@/hooks/useApi";
import { ProfileNameForm } from "./ProfileNameForm";

jest.mock("@/components/UserProvider", () => ({
  useUser: jest.fn(),
}));
jest.mock("@/hooks/useApi", () => ({
  useApi: jest.fn(),
}));

const mockedUseUser = useUser as jest.Mock;
const mockedUseApi = useApi as jest.Mock;

describe("ProfileNameForm", () => {
  const setUser = jest.fn();

  beforeEach(() => {
    mockedUseUser.mockReturnValue({
      user: { id: 1, name: "Ada", email: "a@example.com", role: "user" },
      setUser,
    });
  });

  it("pre-fills the name field from the current user", () => {
    mockedUseApi.mockReturnValue({ apiFetch: jest.fn() });

    render(<ProfileNameForm />);

    expect(screen.getByLabelText("Name")).toHaveValue("Ada");
  });

  it("requires a non-blank name", async () => {
    const apiFetch = jest.fn();
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<ProfileNameForm />);

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.click(screen.getByRole("button", { name: "Save Name" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("updates the shared user context and shows a success message", async () => {
    const updatedUser = { id: 1, name: "Ada Lovelace", email: "a@example.com", role: "user" };
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ user: updatedUser }) });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<ProfileNameForm />);

    const nameInput = screen.getByLabelText("Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Ada Lovelace");
    await userEvent.click(screen.getByRole("button", { name: "Save Name" }));

    await waitFor(() => expect(setUser).toHaveBeenCalledWith(updatedUser));
    expect(await screen.findByText("Name updated.")).toBeInTheDocument();
  });

  it("shows the server's error message on failure", async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Nope" }) });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<ProfileNameForm />);

    await userEvent.click(screen.getByRole("button", { name: "Save Name" }));

    expect(await screen.findByText("Nope")).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
  });
});
