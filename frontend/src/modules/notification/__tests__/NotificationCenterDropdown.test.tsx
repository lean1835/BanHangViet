import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/stores";
import { NotificationCenterDropdown } from "../components/NotificationCenterDropdown";

describe("Trung tâm thông báo (NotificationCenterDropdown)", () => {
  afterEach(() => {
    cleanup();
  });

  it("Render chuông thông báo và mở dropdown khi click", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <NotificationCenterDropdown />
        </MemoryRouter>
      </Provider>
    );

    const bellBtn = screen.getByRole("button", { name: /Trung tâm thông báo/i });
    expect(bellBtn).toBeInTheDocument();

    // Mở dropdown
    fireEvent.click(bellBtn);
    expect(screen.getByText("Trung tâm thông báo")).toBeInTheDocument();
    expect(screen.getByText(/Xem theo dõi doanh thu lũy kế năm/i)).toBeInTheDocument();
  });
});
