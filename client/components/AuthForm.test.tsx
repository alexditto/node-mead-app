import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { AuthForm } from "./AuthForm";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/components/UserProvider", () => ({
  useUser: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseUser = useUser as jest.Mock;

describe("AuthForm", () => {
  const push = jest.fn();
  const setUser = jest.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push });
    mockedUseUser.mockReturnValue({ setUser });
    global.fetch = jest.fn();
  });

  it("shows only email/password fields in login mode", () => {
    render(<AuthForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Confirm Password")).not.toBeInTheDocument();
  });

  it("shows name/confirm-password fields after switching to register", async () => {
    render(<AuthForm />);

    await userEvent.click(screen.getByRole("radio", { name: "Register" }));

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
  });

  it("shows a validation message on blur for an empty required field", async () => {
    render(<AuthForm />);

    await userEvent.click(screen.getByLabelText("Email"));
    await userEvent.tab();

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
  });

  it("shows a validation message for a too-short password", async () => {
    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.tab();

    expect(await screen.findByText("Password must be at least 10 characters")).toBeInTheDocument();
  });

  it("blocks submission and shows errors when fields are invalid", async () => {
    render(<AuthForm />);

    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits login, updates the user, and redirects on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 1, name: "Ada", email: "a@example.com", role: "user" } }),
    });

    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "correcthorsebattery");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() =>
      expect(setUser).toHaveBeenCalledWith({
        id: 1,
        name: "Ada",
        email: "a@example.com",
        role: "user",
      }),
    );

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/auth/login");
    expect(options).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@example.com", password: "correcthorsebattery" }),
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows the server's error message and does not redirect on failed login", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid email or password" }),
    });

    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "correcthorsebattery");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(setUser).not.toHaveBeenCalled();
  });

  it("shows a generic error when the network request itself fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "correcthorsebattery");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(
      await screen.findByText("Unable to reach the server. Please try again."),
    ).toBeInTheDocument();
  });

  it("blocks register submission when passwords don't match", async () => {
    render(<AuthForm />);

    await userEvent.click(screen.getByRole("radio", { name: "Register" }));
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "correcthorsebattery");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "different12345");
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
