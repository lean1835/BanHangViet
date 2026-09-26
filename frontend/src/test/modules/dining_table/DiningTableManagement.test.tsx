import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { DiningTableManagementModal } from "@/modules/dining_table/components/DiningTableManagementModal";
import * as diningTableApiModule from "@/modules/dining_table/services/diningTableApi";
import type { IDiningTable } from "@/modules/dining_table/types/IDiningTable";

const mockTables: IDiningTable[] = [
  {
    id: "table-01",
    name: "Bàn 01",
    area: "Tầng 1",
    seatCapacity: 4,
    sortOrder: 1,
    isActive: true,
    isOccupied: false,
    createdAt: "2026-09-20T00:00:00Z",
    updatedAt: "2026-09-20T00:00:00Z",
  },
  {
    id: "table-02",
    name: "Bàn VIP 1",
    area: "Phòng VIP",
    seatCapacity: 8,
    sortOrder: 2,
    isActive: true,
    isOccupied: true,
    currentOrderLabel: "Đơn #101",
    createdAt: "2026-09-20T00:00:00Z",
    updatedAt: "2026-09-20T00:00:00Z",
  },
];

const createTestStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

describe("NCL-03: Quản lý sơ đồ bàn ăn và phòng (DiningTableManagementModal)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("Render danh sách bàn ăn với thông tin tên bàn, khu vực và số lượng chỗ", () => {
    vi.spyOn(diningTableApiModule, "useGetDiningTablesQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: mockTables },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    render(
      <Provider store={createTestStore()}>
        <DiningTableManagementModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText("Quản Lý Danh Mục Bàn Ăn / Khu Vực")).toBeInTheDocument();
    expect(screen.getByText("Bàn 01")).toBeInTheDocument();
    expect(screen.getByText("Bàn VIP 1")).toBeInTheDocument();
    expect(screen.getByText("Tầng 1")).toBeInTheDocument();
    expect(screen.getByText("Phòng VIP")).toBeInTheDocument();
    expect(screen.getByText("Đơn #101")).toBeInTheDocument();
  });

  it("Mở form thêm bàn mới và tạo bàn thành công (Happy Path)", async () => {
    vi.spyOn(diningTableApiModule, "useGetDiningTablesQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: mockTables },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    const mockCreateMutation = vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000, result: { id: "table-03", name: "Bàn Sân Vườn 1" } }),
    });
    vi.spyOn(diningTableApiModule, "useCreateDiningTableMutation").mockReturnValue([
      mockCreateMutation,
      { isLoading: false },
    ] as any);

    render(
      <Provider store={createTestStore()}>
        <DiningTableManagementModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    // Click button "Thêm bàn mới"
    const addBtn = screen.getByRole("button", { name: /Thêm bàn mới/i });
    fireEvent.click(addBtn);

    // Form inputs
    const nameInput = screen.getByPlaceholderText(/Bàn 01, Bàn VIP/i);
    const areaInput = screen.getByPlaceholderText(/Tầng 1, Sân vườn/i);

    fireEvent.change(nameInput, { target: { value: "Bàn Sân Vườn 1" } });
    fireEvent.change(areaInput, { target: { value: "Khu Sân Vườn" } });

    // Submit form
    const saveBtn = screen.getByRole("button", { name: /Lưu bàn ăn/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockCreateMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Bàn Sân Vườn 1",
          area: "Khu Sân Vườn",
          seatCapacity: 4,
          isActive: true,
        })
      );
    });
  });

  it("Validate chặn tạo bàn khi để trống tên bàn (Unhappy Path - Validation)", async () => {
    vi.spyOn(diningTableApiModule, "useGetDiningTablesQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: mockTables },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    render(
      <Provider store={createTestStore()}>
        <DiningTableManagementModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    const addBtn = screen.getByRole("button", { name: /Thêm bàn mới/i });
    fireEvent.click(addBtn);

    const saveBtn = screen.getByRole("button", { name: /Lưu bàn ăn/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText("Vui lòng nhập tên bàn ăn")).toBeInTheDocument();
  });

  it("Xóa bàn ăn thành công khi xác nhận qua confirm dialog (Delete Flow)", async () => {
    vi.spyOn(diningTableApiModule, "useGetDiningTablesQuery").mockReturnValue({
      data: { code: 1000, message: "Success", result: mockTables },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    const mockDeleteMutation = vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000 }),
    });
    vi.spyOn(diningTableApiModule, "useDeleteDiningTableMutation").mockReturnValue([
      mockDeleteMutation,
      { isLoading: false },
    ] as any);

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <Provider store={createTestStore()}>
        <DiningTableManagementModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    // Table 1 is not occupied, so its delete button is enabled
    const deleteButtons = screen.getAllByTitle(/Xóa bàn/i);
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDeleteMutation).toHaveBeenCalledWith("table-01");
    });
  });
});
