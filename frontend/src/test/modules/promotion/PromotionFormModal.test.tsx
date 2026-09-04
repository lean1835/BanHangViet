import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { PromotionFormModal } from "@/modules/promotion/components/PromotionFormModal";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithStore = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(<Provider store={store}>{ui}</Provider>);
};

describe("PromotionFormModal Redesign", () => {
  it("renders professional input fields with labels, placeholders and counters", () => {
    renderWithStore(
      <PromotionFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Tạo chương trình khuyến mại theo thời gian")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Giảm giá mùa tựu trường/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ghi chú thêm về điều kiện áp dụng/i)).toBeInTheDocument();
    expect(screen.getByText(/Phần trăm \(%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Số tiền cố định/i)).toBeInTheDocument();
    expect(screen.getByText(/Toàn bộ hàng hóa/i)).toBeInTheDocument();
    expect(screen.getByText(/Sản phẩm cụ thể/i)).toBeInTheDocument();
    expect(screen.getByText(/Nhóm hàng/i)).toBeInTheDocument();
  });

  it("switches discount type cleanly between percentage and fixed amount", async () => {
    renderWithStore(
      <PromotionFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const fixedAmountBtn = screen.getByText(/Số tiền cố định/i).closest("button");
    expect(fixedAmountBtn).toBeInTheDocument();

    fireEvent.click(fixedAmountBtn!);
    expect(screen.getByText("₫")).toBeInTheDocument();

    const percentageBtn = screen.getByText(/Phần trăm \(%\)/i).closest("button");
    fireEvent.click(percentageBtn!);
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("switches scope to product and displays product search input", async () => {
    renderWithStore(
      <PromotionFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const productScopeBtn = screen.getByText(/Sản phẩm cụ thể/i).closest("button");
    fireEvent.click(productScopeBtn!);

    expect(screen.getByPlaceholderText(/Tìm sản phẩm theo tên, mã SKU/i)).toBeInTheDocument();
    expect(screen.getByText("Chọn tất cả")).toBeInTheDocument();
    expect(screen.getByText("Bỏ chọn")).toBeInTheDocument();
  });

  it("validates required inputs before submission", async () => {
    const onSubmit = vi.fn();
    renderWithStore(
      <PromotionFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Giảm giá mùa tựu trường/i);
    fireEvent.change(nameInput, { target: { value: "" } });

    const submitBtn = screen.getByText("Lưu chương trình").closest("button");
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(screen.getByText(/Vui lòng nhập tên chương trình/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid form with typed values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithStore(
      <PromotionFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Giảm giá mùa tựu trường/i);
    fireEvent.change(nameInput, { target: { value: "Khuyến mại cuối tuần" } });

    const submitBtn = screen.getByText("Lưu chương trình").closest("button");
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0][0].name).toBe("Khuyến mại cuối tuần");
  });
});
