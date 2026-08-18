import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useUser } from "@/components/UserProvider";
import { Topbar } from "./Topbar";

jest.mock("@/components/UserProvider", () => ({
  useUser: jest.fn(),
}));

const mockedUseUser = useUser as jest.Mock;

describe("Topbar", () => {
  it("renders the current user's name", () => {
    mockedUseUser.mockReturnValue({
      user: { id: 1, name: "Ada", email: "a@example.com", role: "user" },
      logout: jest.fn(),
    });

    render(<Topbar />);

    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("calls logout when the Log Out button is clicked", async () => {
    const logout = jest.fn();
    mockedUseUser.mockReturnValue({
      user: { id: 1, name: "Ada", email: "a@example.com", role: "user" },
      logout,
    });

    render(<Topbar />);
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
