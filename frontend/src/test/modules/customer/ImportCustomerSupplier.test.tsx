import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import { DashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { ImportCustomerSupplierModal } from "@/modules/customer/components/ImportCustomerSupplierModal";
import { ImportCustomerModal } from "@/modules/customer/components/ImportCustomerModal";
import { ImportSupplierModal } from "@/modules/supplier/components/ImportSupplierModal";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";
import * as customerApiModule from "@/modules/customer/services/customerApi";
import * as supplierApiModule from "@/modules/supplier/services/supplierApi";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockShowWarning = vi.fn();
const mockShowInfo = vi.fn();

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: mockShowWarning,
    showInfo: mockShowInfo,
  }),
}));

const mockWriteFile = vi.fn();
let mockSheetRows: any[] = [];

vi.mock("xlsx", async () => {
  const actual: any = await vi.importActual("xlsx");
  return {
    ...actual,
    writeFile: (...args: any[]) => mockWriteFile(...args),
    read: () => ({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    }),
    utils: {
      ...actual.utils,
      sheet_to_json: () => mockSheetRows,
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSheetRows = [];

  vi.spyOn(customerApiModule, "useGetCustomersQuery").mockReturnValue({
    data: [
      {
        id: "c-01",
        name: "Nguyễn Văn Đã Có",
        phone: "0987654321",
        taxCode: "0102030405",
      },
    ],
    isLoading: false,
  } as any);

  vi.spyOn(customerApiModule, "useCreateCustomerMutation").mockReturnValue([
    vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000, message: "OK", result: {} }),
    }),
    { isLoading: false } as any,
  ]);

  vi.spyOn(supplierApiModule, "useGetSuppliersQuery").mockReturnValue({
    data: [
      {
        id: "s-01",
        name: "Nhà Cung Cấp Đã Có",
        phoneNumber: "0909123456",
        taxCode: "0312345678",
      },
    ],
    isLoading: false,
  } as any);

  vi.spyOn(supplierApiModule, "useCreateSupplierMutation").mockReturnValue([
    vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve({ code: 1000, message: "OK", result: {} }),
    }),
    { isLoading: false } as any,
  ]);

  vi.spyOn(customerApiModule, "useImportCustomersMutation").mockReturnValue([
    vi.fn().mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          totalRows: 1,
          successCount: 1,
          updatedCount: 0,
          skippedCount: 0,
          errorCount: 0,
        }),
    }),
    { isLoading: false } as any,
  ]);

  vi.spyOn(supplierApiModule, "useImportSuppliersMutation").mockReturnValue([
    vi.fn().mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          totalRows: 1,
          successCount: 1,
          updatedCount: 0,
          skippedCount: 0,
          errorCount: 0,
        }),
    }),
    { isLoading: false } as any,
  ]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithProviders = (
  ui: React.ReactElement,
  role: TDemoRole = USER_ROLES.OWNER
) => {
  const store = configureStore({
    reducer: {
      auth: (state = {
        user: {
          id: "1",
          username: "testowner",
          fullName: "Chủ hộ A",
          roleId: role,
          household: null,
        },
        token: "fake-token",
        isAuthenticated: true,
      }) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(baseApi.middleware),
  });

  const mockContextValue: any = {
    currentRole: role,
    setCurrentRole: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
    simConflict: false,
    setSimConflict: vi.fn(),
    invoices: [],
    setInvoices: vi.fn(),
    customers: [
      {
        id: "c-01",
        name: "Nguyễn Văn Đã Có",
        phone: "0987654321",
        taxCode: "0102030405",
      },
    ],
    logs: [],
    addActivityLog: vi.fn(),
    refetchOrders: vi.fn(),
  };

  return render(
    <Provider store={store}>
      <DashboardDemoContext.Provider value={mockContextValue}>
        <NotificationProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </NotificationProvider>
      </DashboardDemoContext.Provider>
    </Provider>
  );
};

describe("NCL-09-CN-009: Nhập danh mục khách hàng và nhà cung cấp từ tệp", () => {
  it("TC-01: Hiển thị modal nhập danh mục với nút tải tệp mẫu Excel và vùng kéo thả file", () => {
    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
        allowTypeSwitch={true}
      />,
      USER_ROLES.OWNER
    );

    // Title
    expect(screen.getByText("Nhập danh mục từ tệp bảng tính")).toBeInTheDocument();

    // Tabs
    expect(screen.getByRole("button", { name: /Danh mục Khách hàng/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Danh mục Nhà cung cấp/i })).toBeInTheDocument();

    // Download template button
    expect(screen.getByRole("button", { name: /Tải tệp mẫu Excel/i })).toBeInTheDocument();

    // Dropzone text & instructions
    expect(screen.getByText(/Bấm để chọn tệp bảng tính/i)).toBeInTheDocument();
    expect(screen.getByText(/hoặc kéo thả tệp vào đây/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Hỗ trợ định dạng: Microsoft Excel \(\.xlsx, \.xls\) hoặc CSV\. Dung lượng tối đa: 5MB\./i)
    ).toBeInTheDocument();
  });

  it("TC-02: Chuyển đổi qua lại giữa danh mục Khách hàng và Nhà cung cấp", () => {
    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
        allowTypeSwitch={true}
      />,
      USER_ROLES.OWNER
    );

    const supplierTab = screen.getByRole("button", { name: /Danh mục Nhà cung cấp/i });
    fireEvent.click(supplierTab);

    expect(screen.getByRole("button", { name: /Danh mục Nhà cung cấp/i })).toHaveClass("text-kv-blue-primary");

    const customerTab = screen.getByRole("button", { name: /Danh mục Khách hàng/i });
    fireEvent.click(customerTab);

    expect(screen.getByRole("button", { name: /Danh mục Khách hàng/i })).toHaveClass("text-kv-blue-primary");
  });

  it("TC-03: Tải tệp mẫu Excel chuẩn hóa cho cả Khách hàng và Nhà cung cấp", () => {
    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
        allowTypeSwitch={true}
      />,
      USER_ROLES.OWNER
    );

    // 1. Download Customer template
    const downloadButton = screen.getByRole("button", { name: /Tải tệp mẫu Excel/i });
    fireEvent.click(downloadButton);

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.anything(),
      "Mau_Nhap_Danh_Muc_Khach_Hang_BanHangViet.xlsx"
    );
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.stringContaining("Đã tải xuống tệp Excel mẫu danh mục Khách hàng")
    );

    // 2. Switch to Supplier and download Supplier template
    const supplierTab = screen.getByRole("button", { name: /Danh mục Nhà cung cấp/i });
    fireEvent.click(supplierTab);

    fireEvent.click(downloadButton);
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.anything(),
      "Mau_Nhap_Danh_Muc_Nha_Cung_Cap_BanHangViet.xlsx"
    );
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.stringContaining("Đã tải xuống tệp Excel mẫu danh mục Nhà cung cấp")
    );
  });

  it("TC-04: Kiểm tra chặn tệp sai định dạng và tệp vượt quá dung lượng 5MB", () => {
    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // 1. Invalid extension (.pdf)
    const invalidFile = new File(["dummy content"], "invoice_list.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(mockShowError).toHaveBeenCalledWith(
      "Vui lòng chọn tệp có định dạng .xlsx, .xls hoặc .csv"
    );

    // 2. Oversized file (> 5MB)
    const oversizedFile = new File(["a".repeat(100)], "big_customer_data.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(oversizedFile, "size", { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
    expect(mockShowError).toHaveBeenCalledWith(
      "Dung lượng tệp vượt quá giới hạn cho phép (tối đa 5MB)."
    );
  });

  it("TC-05: Kéo thả tệp hợp lệ vào vùng Dropzone kích hoạt đọc dữ liệu", () => {
    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const dropzone = screen.getByTestId("import-dropzone");

    // Dragover event
    fireEvent.dragOver(dropzone);

    // Drop valid excel file
    const validFile = new File(["content"], "customers_valid.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(validFile, "size", { value: 1024 });
    Object.defineProperty(validFile, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [validFile],
      },
    });

    // File selected should not trigger format or size error
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("TC-06: Phân tích dữ liệu & Bảng xem trước (Preview Grid) phân loại dòng Hợp lệ và Lỗi", async () => {
    mockSheetRows = [
      {
        "Tên khách hàng (*)": "Nguyễn Văn Hợp Lệ",
        "Số điện thoại (*)": "0912345678",
        "Mã số thuế": "0102030405",
        "Địa chỉ": "Hà Nội",
        "Email": "hople@gmail.com",
      },
      {
        "Tên khách hàng (*)": "", // Missing name
        "Số điện thoại (*)": "0987654321",
        "Mã số thuế": "",
      },
      {
        "Tên khách hàng (*)": "Trần Văn Thiếu Số",
        "Số điện thoại (*)": "09123", // Short phone
        "Mã số thuế": "",
      },
    ];

    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["fake binary data"], "test_customers.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(testFile, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      // Step transitions to PREVIEW
      expect(screen.getByText("Tổng số dòng")).toBeInTheDocument();
      expect(screen.getByText("Hợp lệ")).toBeInTheDocument();
      expect(screen.getByText("Lỗi định dạng")).toBeInTheDocument();
      expect(screen.getByText("Nguyễn Văn Hợp Lệ")).toBeInTheDocument();
      expect(screen.getByText("Trần Văn Thiếu Số")).toBeInTheDocument();
      expect(screen.getByText(/Tên không được để trống/i)).toBeInTheDocument();
      expect(screen.getByText(/Số điện thoại phải từ 10 - 11 chữ số/i)).toBeInTheDocument();
    });
  });

  it("TC-07: Phát hiện dòng trùng lặp và cho phép chọn chiến lược xử lý", async () => {
    // Row 1 has duplicate phone with existing customer "0987654321"
    mockSheetRows = [
      {
        "Tên khách hàng (*)": "Khách Trùng Số",
        "Số điện thoại (*)": "0987654321",
        "Mã số thuế": "",
      },
      {
        "Tên khách hàng (*)": "Khách Mới Chuẩn",
        "Số điện thoại (*)": "0909123456",
        "Mã số thuế": "",
      },
    ];

    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["fake binary data"], "duplicates.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(testFile, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getAllByText("Trùng lặp").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Khách Trùng Số")).toBeInTheDocument();
      expect(screen.getByText(/Số điện thoại đã tồn tại trên hồ sơ khách hàng/i)).toBeInTheDocument();
    });

    // Duplicate strategy options
    const skipRadio = screen.getByLabelText(/Bỏ qua dòng trùng/i);
    const updateRadio = screen.getByLabelText(/Cập nhật thông tin/i);

    expect(skipRadio).toBeChecked();
    fireEvent.click(updateRadio);
    expect(updateRadio).toBeChecked();
  });

  it("TC-08: Xuất tệp Excel danh sách các dòng bị lỗi để người dùng sửa lại", async () => {
    mockSheetRows = [
      {
        "Tên khách hàng (*)": "Khách Lỗi SĐT",
        "Số điện thoại (*)": "123", // Error
        "Mã số thuế": "",
      },
    ];

    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["fake binary data"], "with_errors.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(testFile, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      const exportErrorButton = screen.getByRole("button", {
        name: /Xuất tệp các dòng lỗi/i,
      });
      expect(exportErrorButton).toBeInTheDocument();

      fireEvent.click(exportErrorButton);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/^Danh_Sach_Loi_Nhap_Khach_Hang_\d+\.xlsx$/)
      );
    });
  });

  it("TC-09: Tiến hành nhập dữ liệu thành công và gọi callback onImportSuccess", async () => {
    const mockOnSuccess = vi.fn();

    vi.spyOn(customerApiModule, "useCreateCustomerMutation").mockReturnValue([
      vi.fn().mockReturnValue({
        unwrap: () => Promise.resolve({ code: 1000, message: "OK", result: {} }),
      }),
      { isLoading: false } as any,
    ]);

    mockSheetRows = [
      {
        "Tên khách hàng (*)": "Khách Hàng Tuyệt Vời",
        "Số điện thoại (*)": "0918889999",
        "Mã số thuế": "",
      },
    ];

    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
        onImportSuccess={mockOnSuccess}
      />,
      USER_ROLES.OWNER
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["fake binary data"], "import_ready.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(testFile, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Xác nhận nhập danh mục/i })).not.toBeDisabled();
    });

    const submitButton = screen.getByRole("button", { name: /Xác nhận nhập danh mục/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Step transitions to RESULT
      expect(screen.getByText(/Nhập danh mục Khách hàng thành công!/i)).toBeInTheDocument();
      expect(mockOnSuccess).toHaveBeenCalledWith(1);
    });
  });

  it("TC-10: Đóng modal khi bấm Hủy bỏ hoặc nút Đóng", () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={handleClose}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const cancelButton = screen.getByRole("button", { name: "Hủy bỏ" });
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("TC-11: Bắt lỗi và dừng lại khi tệp Excel thiếu tiêu đề cột bắt buộc", async () => {
    // Missing required columns (no 'Tên khách hàng' or 'Số điện thoại')
    mockSheetRows = [
      {
        "Mã khách hàng": "KH001",
        "Địa chỉ": "123 Cầu Giấy, Hà Nội",
      },
    ];

    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["fake binary data"], "missing_headers.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(testFile, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Tệp Excel thiếu các cột bắt buộc: Tên khách hàng, Số điện thoại. Vui lòng kiểm tra lại cấu trúc file hoặc tải tệp mẫu!")
      );
      // Stays in UPLOAD step
      expect(screen.getByRole("button", { name: /Tải tệp mẫu Excel/i })).toBeInTheDocument();
    });
  });

  it("TC-12: Chỉnh sửa trực tiếp ô dữ liệu (Inline Editing) và tự động tính toán lại lỗi", async () => {
    mockSheetRows = [
      {
        "Tên khách hàng (*)": "Nguyễn Văn Thiếu",
        "Số điện thoại (*)": "09123", // Short phone => Error
      },
    ];

    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["fake binary data"], "editable.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(testFile, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Số điện thoại phải từ 10 - 11 chữ số/i)).toBeInTheDocument();
    });

    // Find the phone input and fix it
    const phoneInput = screen.getByDisplayValue("09123");
    fireEvent.change(phoneInput, { target: { value: "0912345678" } });

    await waitFor(() => {
      // Error message should disappear and status changes to VALID
      expect(screen.queryByText(/Số điện thoại phải từ 10 - 11 chữ số/i)).not.toBeInTheDocument();
      expect(screen.getAllByText("Hợp lệ").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("TC-13: Chặn bấm hoàn tất khi còn dòng bị lỗi (Strict Error Blocking)", async () => {
    mockSheetRows = [
      {
        "Tên khách hàng (*)": "Nguyễn Văn Hợp Lệ",
        "Số điện thoại (*)": "0912345678",
      },
      {
        "Tên khách hàng (*)": "Khách Sai Số",
        "Số điện thoại (*)": "123", // Invalid phone => Error
      },
    ];

    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["fake binary data"], "has_errors.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(testFile, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByText("Khách Sai Số")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Xác nhận nhập danh mục/i });
    fireEvent.click(submitBtn);

    expect(mockShowError).toHaveBeenCalledWith(
      expect.stringContaining("Còn 1 dòng bị lỗi (tô đỏ). Vui lòng chỉnh sửa trực tiếp hoặc xóa các dòng bị lỗi trước khi bấm Hoàn tất!")
    );
  });

  it("TC-14: Xóa dòng lỗi bằng thanh công cụ thao tác hàng loạt (Batch Action)", async () => {
    mockSheetRows = [
      {
        "Tên khách hàng (*)": "Nguyễn Văn Hợp Lệ",
        "Số điện thoại (*)": "0912345678",
      },
      {
        "Tên khách hàng (*)": "Khách Lỗi Dòng 2",
        "Số điện thoại (*)": "999",
      },
    ];

    renderWithProviders(
      <ImportCustomerSupplierModal
        isOpen={true}
        onClose={vi.fn()}
        defaultType="CUSTOMER"
      />,
      USER_ROLES.OWNER
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["fake binary data"], "batch_delete.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(testFile, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Xóa tất cả dòng lỗi/i })).toBeInTheDocument();
    });

    const deleteErrorsBtn = screen.getByRole("button", { name: /Xóa tất cả dòng lỗi/i });
    fireEvent.click(deleteErrorsBtn);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Đã xóa 1 dòng bị lỗi khỏi danh sách xem trước."
      );
      expect(screen.queryByText("Khách Lỗi Dòng 2")).not.toBeInTheDocument();
      expect(screen.getByText("Nguyễn Văn Hợp Lệ")).toBeInTheDocument();
    });
  });

  it("TC-15: Chức năng ImportCustomerModal chuyên biệt cho Khách hàng: KHÔNG hiển thị tab chuyển đổi loại danh mục, tiêu đề hiển thị rõ 'Nhập danh mục khách hàng từ tệp bảng tính'", () => {
    renderWithProviders(
      <ImportCustomerModal
        isOpen={true}
        onClose={vi.fn()}
      />,
      USER_ROLES.OWNER
    );

    // Tiêu đề chuyên biệt cho Khách hàng
    expect(screen.getByText("Nhập danh mục khách hàng từ tệp bảng tính")).toBeInTheDocument();
    expect(screen.getByText(/Nạp nhanh danh sách khách hàng từ Excel/i)).toBeInTheDocument();

    // KHÔNG hiển thị tab chuyển đổi loại danh mục để tách riêng biệt hoàn toàn
    expect(screen.queryByRole("button", { name: /Danh mục Nhà cung cấp/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Danh mục Khách hàng/i })).not.toBeInTheDocument();

    // Nút tải tệp mẫu
    expect(screen.getByRole("button", { name: /Tải tệp mẫu Excel/i })).toBeInTheDocument();
  });

  it("TC-16: Chức năng ImportSupplierModal chuyên biệt cho Nhà cung cấp: KHÔNG hiển thị tab chuyển đổi loại danh mục, tiêu đề hiển thị rõ 'Nhập danh mục nhà cung cấp từ tệp bảng tính'", () => {
    renderWithProviders(
      <ImportSupplierModal
        isOpen={true}
        onClose={vi.fn()}
      />,
      USER_ROLES.OWNER
    );

    // Tiêu đề chuyên biệt cho Nhà cung cấp
    expect(screen.getByText("Nhập danh mục nhà cung cấp từ tệp bảng tính")).toBeInTheDocument();
    expect(screen.getByText(/Nạp nhanh danh sách nhà cung cấp từ Excel/i)).toBeInTheDocument();

    // KHÔNG hiển thị tab chuyển đổi loại danh mục để tách riêng biệt hoàn toàn
    expect(screen.queryByRole("button", { name: /Danh mục Nhà cung cấp/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Danh mục Khách hàng/i })).not.toBeInTheDocument();

    // Nút tải tệp mẫu
    expect(screen.getByRole("button", { name: /Tải tệp mẫu Excel/i })).toBeInTheDocument();
  });
});
