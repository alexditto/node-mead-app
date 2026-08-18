import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useApi } from "@/hooks/useApi";
import { NewBatchModal } from "./NewBatchModal";

jest.mock("@/hooks/useApi", () => ({
  useApi: jest.fn(),
}));

const mockedUseApi = useApi as jest.Mock;

function mockApiFetch(handlers: Record<string, () => Promise<unknown>>) {
  return jest.fn((path: string) => {
    const handler = handlers[path];
    if (!handler) throw new Error(`No mock handler for ${path}`);
    return handler();
  });
}

describe("NewBatchModal", () => {
  it("shows a loading state, then the recipe options once loaded", async () => {
    const apiFetch = mockApiFetch({
      "/api/recipes": async () => ({
        ok: true,
        json: async () => [{ id: 1, name: "Traditional Mead" }],
      }),
    });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<NewBatchModal onClose={jest.fn()} onCreated={jest.fn()} />);

    expect(screen.getByText("Loading recipes…")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Traditional Mead" })).toBeInTheDocument();
  });

  it("shows an empty state and disables submit when there are no recipes", async () => {
    const apiFetch = mockApiFetch({
      "/api/recipes": async () => ({ ok: true, json: async () => [] }),
    });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<NewBatchModal onClose={jest.fn()} onCreated={jest.fn()} />);

    expect(
      await screen.findByText("You don't have any recipes yet. Create one first."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Batch" })).toBeDisabled();
  });

  it("submits the selected recipe and start date, then calls onCreated", async () => {
    const onCreated = jest.fn();
    const apiFetch = mockApiFetch({
      "/api/recipes": async () => ({ ok: true, json: async () => [{ id: 3, name: "Cyser" }] }),
      "/api/batches": async () => ({ ok: true, json: async () => ({}) }),
    });
    mockedUseApi.mockReturnValue({ apiFetch });

    render(<NewBatchModal onClose={jest.fn()} onCreated={onCreated} />);

    await screen.findByRole("option", { name: "Cyser" });
    await userEvent.click(screen.getByRole("button", { name: "Create Batch" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());

    const batchCall = apiFetch.mock.calls.find(([path]) => path === "/api/batches");
    expect(batchCall[1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const body = JSON.parse(batchCall[1].body);
    expect(body.recipeId).toBe(3);
    expect(typeof body.startDate).toBe("string");
  });

  it("shows the server's error message on a failed submit", async () => {
    const apiFetch = mockApiFetch({
      "/api/recipes": async () => ({ ok: true, json: async () => [{ id: 3, name: "Cyser" }] }),
      "/api/batches": async () => ({ ok: false, json: async () => ({ error: "Recipe not found" }) }),
    });
    mockedUseApi.mockReturnValue({ apiFetch });
    const onCreated = jest.fn();

    render(<NewBatchModal onClose={jest.fn()} onCreated={onCreated} />);

    await screen.findByRole("option", { name: "Cyser" });
    await userEvent.click(screen.getByRole("button", { name: "Create Batch" }));

    expect(await screen.findByText("Recipe not found")).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("calls onClose on backdrop click but not on clicks inside the dialog", async () => {
    const onClose = jest.fn();
    const apiFetch = mockApiFetch({
      "/api/recipes": async () => ({ ok: true, json: async () => [] }),
    });
    mockedUseApi.mockReturnValue({ apiFetch });

    const { container } = render(<NewBatchModal onClose={onClose} onCreated={jest.fn()} />);

    await screen.findByText("You don't have any recipes yet. Create one first.");

    await userEvent.click(screen.getByRole("heading", { name: "New Batch" }));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(container.querySelector(".dialog-backdrop") as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
