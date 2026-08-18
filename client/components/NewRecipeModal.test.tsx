import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useApi } from "@/hooks/useApi";
import { NewRecipeModal } from "./NewRecipeModal";

jest.mock("@/hooks/useApi", () => ({
  useApi: jest.fn(),
}));

const mockedUseApi = useApi as jest.Mock;

describe("NewRecipeModal", () => {
  it("requires name and ingredients before submitting", async () => {
    const apiFetch = jest.fn();
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<NewRecipeModal onClose={jest.fn()} onCreated={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Create Recipe" }));

    expect(await screen.findByText("Name and ingredients are required")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("submits the name and ingredients and calls onCreated on success", async () => {
    const apiFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    mockedUseApi.mockReturnValue({ apiFetch });
    const onCreated = jest.fn();

    render(<NewRecipeModal onClose={jest.fn()} onCreated={onCreated} />);

    await userEvent.type(screen.getByLabelText("Name"), "Traditional Mead");
    await userEvent.type(screen.getByLabelText("Ingredients"), "honey, water, yeast");
    await userEvent.click(screen.getByRole("button", { name: "Create Recipe" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());

    expect(apiFetch).toHaveBeenCalledWith("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Traditional Mead", ingredients: "honey, water, yeast" }),
    });
  });

  it("shows the server's error message on failure", async () => {
    const apiFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Something went wrong" }),
    });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<NewRecipeModal onClose={jest.fn()} onCreated={jest.fn()} />);

    await userEvent.type(screen.getByLabelText("Name"), "Traditional Mead");
    await userEvent.type(screen.getByLabelText("Ingredients"), "honey, water, yeast");
    await userEvent.click(screen.getByRole("button", { name: "Create Recipe" }));

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = jest.fn();
    mockedUseApi.mockReturnValue({ apiFetch: jest.fn() });

    render(<NewRecipeModal onClose={onClose} onCreated={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
