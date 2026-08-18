import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "./FilterBar";

describe("FilterBar", () => {
  it("checks the radio matching the current status", () => {
    render(<FilterBar status="ACTIVE" onStatusChange={jest.fn()} onNewBatch={jest.fn()} />);

    expect(screen.getByRole("radio", { name: "Active" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "All" })).not.toBeChecked();
  });

  it("calls onStatusChange with the selected tab's value", async () => {
    const onStatusChange = jest.fn();
    render(<FilterBar status="ALL" onStatusChange={onStatusChange} onNewBatch={jest.fn()} />);

    await userEvent.click(screen.getByRole("radio", { name: "Bottled" }));

    expect(onStatusChange).toHaveBeenCalledWith("BOTTLED");
  });

  it("calls onNewBatch when the button is clicked", async () => {
    const onNewBatch = jest.fn();
    render(<FilterBar status="ALL" onStatusChange={jest.fn()} onNewBatch={onNewBatch} />);

    await userEvent.click(screen.getByRole("button", { name: /new batch/i }));

    expect(onNewBatch).toHaveBeenCalledTimes(1);
  });
});
