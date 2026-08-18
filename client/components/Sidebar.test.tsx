import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockedUsePathname = usePathname as jest.Mock;

describe("Sidebar", () => {
  it("renders all five nav links", () => {
    mockedUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /recipes/i })).toHaveAttribute("href", "/recipes");
    expect(screen.getByRole("link", { name: /batches/i })).toHaveAttribute("href", "/batches");
    expect(screen.getByRole("link", { name: /friends/i })).toHaveAttribute("href", "/friends");
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/settings");
  });

  it("marks the current route as active and leaves the rest alone", () => {
    mockedUsePathname.mockReturnValue("/recipes");
    render(<Sidebar />);

    const recipesLink = screen.getByRole("link", { name: /recipes/i });
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });

    expect(recipesLink).toHaveAttribute("aria-current", "page");
    expect(dashboardLink).not.toHaveAttribute("aria-current");
  });

  it("treats sub-paths of the current route as active too", () => {
    mockedUsePathname.mockReturnValue("/batches/123");
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /batches/i })).toHaveAttribute("aria-current", "page");
  });
});
