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
    expect(screen.getByText("Thông báo")).toBeInTheDocument();
    expect(screen.getByText(/Xem tất cả thông báo/i)).toBeInTheDocument();
    expect(screen.getByText("Chưa đọc")).toBeInTheDocument();
    // Không còn nút load/quét lại
    expect(screen.queryByTitle("Quét lại việc cần làm")).not.toBeInTheDocument();
  });

  it("Không hiển thị số đỏ khi unreadCount = 0 mặc dù unclosedCount > 0 (đã đọc hết)", () => {
    localStorage.clear();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <NotificationCenterDropdown />
        </MemoryRouter>
      </Provider>
    );

    // Khi không có thông báo chưa đọc, không được có badge số đỏ ngoài chuông
    expect(screen.queryByText("15")).not.toBeInTheDocument();
  });
});
