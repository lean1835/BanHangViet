import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { NotificationProvider } from "./NotificationProvider";

const NotificationHarness = () => {
  const { showError, showInfo, showSuccess } = useNotification();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          showSuccess("Thông báo đầu tiên");
          showError("Thông báo thứ hai");
        }}
      >
        Hiển thị hai thông báo
      </button>
      <button type="button" onClick={() => showInfo("Tính năng chưa được hỗ trợ") }>
        Hiển thị thông tin
      </button>
    </div>
  );
};

const renderNotifications = () =>
  render(
    <NotificationProvider>
      <NotificationHarness />
    </NotificationProvider>,
  );

const DialogNotificationHarness = () => {
  const { showError } = useNotification();
  const dialogRef = useAccessibleDialog({ isOpen: true });

  return (
    <section ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1}>
      <button type="button" onClick={() => showError("Không thể lưu dữ liệu") }>
        Lưu dữ liệu
      </button>
    </section>
  );
};

describe("NotificationProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("hiển thị các thông báo tuần tự thay vì ghi đè", () => {
    renderNotifications();

    fireEvent.click(screen.getByRole("button", { name: "Hiển thị hai thông báo" }));

    expect(screen.getByText("Thông báo đầu tiên")).toBeInTheDocument();
    expect(screen.queryByText("Thông báo thứ hai")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    act(() => vi.advanceTimersByTime(200));

    expect(screen.getByText("Thông báo thứ hai")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Thất bại" })).toBeInTheDocument();
  });

  it("dùng trạng thái thông tin cho chức năng chưa được hỗ trợ", () => {
    renderNotifications();

    fireEvent.click(screen.getByRole("button", { name: "Hiển thị thông tin" }));

    expect(screen.getByRole("heading", { name: "Thông tin" })).toBeInTheDocument();
    expect(screen.getByText("Tính năng chưa được hỗ trợ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đã hiểu" })).toBeInTheDocument();
  });

  it("giữ focus trong dialog và trả focus khi đóng", () => {
    renderNotifications();
    const trigger = screen.getByRole("button", { name: "Hiển thị thông tin" });
    trigger.getClientRects = () => [{ width: 1, height: 1 }] as unknown as DOMRectList;

    trigger.focus();
    fireEvent.click(trigger);
    act(() => vi.advanceTimersByTime(0));

    const closeButton = screen.getByRole("button", { name: "Đã hiểu" });
    closeButton.getClientRects = () =>
      [{ width: 1, height: 1 }] as unknown as DOMRectList;
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    act(() => vi.advanceTimersByTime(200));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("ẩn modal phía dưới và trả focus về modal đó khi thông báo đóng", () => {
    render(
      <NotificationProvider>
        <DialogNotificationHarness />
      </NotificationProvider>,
    );
    const dialog = screen.getByRole("dialog");
    const saveButton = screen.getByRole("button", { name: "Lưu dữ liệu" });
    saveButton.getClientRects = () =>
      [{ width: 1, height: 1 }] as unknown as DOMRectList;
    saveButton.focus();

    fireEvent.click(saveButton);

    expect(dialog).toHaveAttribute("aria-hidden", "true");
    expect(dialog).toHaveAttribute("inert");

    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    act(() => vi.advanceTimersByTime(200));

    expect(dialog).not.toHaveAttribute("aria-hidden");
    expect(dialog).not.toHaveAttribute("inert");
    expect(saveButton).toHaveFocus();
  });
});
