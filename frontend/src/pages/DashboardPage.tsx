import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { logout } from "@/stores/authSlice";
import { baseApi } from "@/stores/baseApi";
import { EmployeeList } from "../modules/employee/components/EmployeeList";
import { EmployeeSidebar } from "../modules/employee/components/EmployeeSidebar";
import { IRole } from "../modules/employee/types/employee";
import { useGetAllEmployeesQuery } from "../modules/employee/services/employeeApi";
import { ProductList } from "../modules/product/components/ProductList";
import { ProductSidebar } from "../modules/product/components/ProductSidebar";
import { GoodsReceiptModal, GoodsReceiptFormValues } from "../modules/product/components/GoodsReceiptModal";
import { useGetProductsQuery, useUpdateProductMutation } from "../modules/product/services/productApi";


// TypeScript Interfaces for mock data

interface IStockEntry {
  id: string;
  time: string;
  sku: string;
  name: string;
  qty: number;
  importPrice: number;
  total: number;
  notes: string;
}

interface IShift {
  id: string;
  user: string;
  openTime: string;
  closeTime: string;
  openingCash: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  status: "OPEN" | "CLOSED";
  reason?: string;
}

interface IInvoice {
  id: string;
  lookupCode: string;
  symbol: string;
  customer: string;
  amount: number;
  taxAmount: number;
  finalAmount: number;
  status: "DRAFT" | "WAITING_TAX_CODE" | "ISSUED" | "SEND_ERROR" | "ADJUSTED" | "CANCELED";
  taxAuthorityCode: string;
  time: string;
}

interface ICustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  creditLimit: number;
  debt: number;
}

interface ILog {
  id: string;
  time: string;
  user: string;
  action: string;
  target: string;
}

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
  };

  const household = user?.household;
  const roleId = user?.roleId || "VT-01";

  // Helper to resolve role name
  const getRoleName = (role: string) => {
    switch (role) {
      case "VT-01":
        return "Chủ hộ kinh doanh";
      case "VT-02":
        return "Nhân viên bán hàng";
      case "VT-03":
        return "Kế toán";
      case "VT-04":
        return "Quản trị nền tảng";
      case "VT-05":
        return "Cơ quan thuế mô phỏng";
      default:
        return "Người dùng";
    }
  };

  // State controls
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "products" | "shifts" | "invoices" | "customers" | "employees" | "reports" | "config" | "pos"
  >("dashboard");
  const [isOnline, setIsOnline] = useState(true);
  const [simConflict, setSimConflict] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>(roleId);
  const [adminTab, setAdminTab] = useState<"overview" | "households" | "logs">("overview");
  const [taxTab, setTaxTab] = useState<"invoices" | "config">("invoices");
  const canViewGoodsReceipts = currentRole === "VT-01" || currentRole === "VT-03";
  const canCreateGoodsReceipt = currentRole === "VT-01";

  const isTabVisible = (tabId: string) => {
    if (currentRole === "VT-02") {
      return !["products", "reports", "config", "employees"].includes(tabId);
    }
    if (currentRole === "VT-03") {
      return !["shifts"].includes(tabId);
    }
    return true;
  };

  // Sub-tabs
  const [productSubTab, setProductSubTab] = useState<"list" | "stock-entry">("list");
  const [reportSubTab, setReportSubTab] = useState<"revenue" | "comparison" | "logs">("revenue");
  const [configSubTab, setConfigSubTab] = useState<"info" | "tax" | "printer">("info");

  // Chart local filters
  const [dashTimeFilter, setDashTimeFilter] = useState("Tháng này");
  const [chartSubTab, setChartSubTab] = useState<"day" | "hour" | "week">("day");
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState("ALL");

  // Product state filters and hooks
  const [prodGroupFilter, setProdGroupFilter] = useState("ALL");
  const [prodStockFilter, setProdStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");

  const { data: dbProductsData } = useGetProductsQuery({ size: 100 });
  const dbProducts = dbProductsData?.content || [];
  const [updateProduct] = useUpdateProductMutation();

  const [stockEntries, setStockEntries] = useState<IStockEntry[]>([
    {
      id: "se1",
      time: "2026-07-15 08:30:15",
      sku: "8934567890123",
      name: "Nước ngọt Coca-Cola lon 320ml",
      qty: 100,
      importPrice: 7500,
      total: 750000,
      notes: "Nhà phân phối Coca-Cola Miền Bắc",
    },
    {
      id: "se2",
      time: "2026-07-14 14:15:22",
      sku: "8931234567890",
      name: "Mì ăn liền Hảo Hảo Tôm Chua Cay",
      qty: 150,
      importPrice: 3800,
      total: 570000,
      notes: "Đại lý tạp hóa tổng hợp Thành Tâm",
    },
  ]);
  const [stockEntrySearch, setStockEntrySearch] = useState("");
  const [isGoodsReceiptModalOpen, setIsGoodsReceiptModalOpen] = useState(false);
  const normalizedStockEntrySearch = stockEntrySearch.trim().toLocaleLowerCase("vi");
  const filteredStockEntries = stockEntries.filter((entry) => {
    if (!normalizedStockEntrySearch) return true;

    return [entry.id, entry.time, entry.sku, entry.name, entry.notes].some((value) =>
      value.toLocaleLowerCase("vi").includes(normalizedStockEntrySearch)
    );
  });

  const [shifts, setShifts] = useState<IShift[]>([
    {
      id: "s1",
      user: "nhanvien_viet",
      openTime: "2026-07-13 08:00:00",
      closeTime: "2026-07-13 17:00:00",
      openingCash: 1000000,
      expectedCash: 3500000,
      actualCash: 3500000,
      difference: 0,
      status: "CLOSED",
    },
    {
      id: "s2",
      user: "ketoan_viet",
      openTime: "2026-07-14 08:00:00",
      closeTime: "2026-07-14 17:00:00",
      openingCash: 1000000,
      expectedCash: 2450000,
      actualCash: 2430000,
      difference: -20000,
      status: "CLOSED",
      reason: "Thối nhầm tiền lẻ cho khách quen",
    },
  ]);

  const [currentShift, setCurrentShift] = useState<IShift | null>(null);
  const [openingCashInput, setOpeningCashInput] = useState(1000000);
  const [closingActualInput, setClosingActualInput] = useState(1000000);
  const [closingReason, setClosingReason] = useState("");

  const [invoices, setInvoices] = useState<IInvoice[]>([
    {
      id: "inv1",
      lookupCode: "HD-VT001",
      symbol: "1C26TAA",
      customer: "Khách vãng lai",
      amount: 150000,
      taxAmount: 12000,
      finalAmount: 162000,
      status: "ISSUED",
      taxAuthorityCode: "CQT-20260715-00124A",
      time: "2026-07-15 09:12:45",
    },
    {
      id: "inv2",
      lookupCode: "HD-VT002",
      symbol: "1C26TAA",
      customer: "Trần Thị B",
      amount: 250000,
      taxAmount: 20000,
      finalAmount: 270000,
      status: "ISSUED",
      taxAuthorityCode: "CQT-20260715-00125B",
      time: "2026-07-15 09:30:12",
    },
    {
      id: "inv3",
      lookupCode: "HD-VT003",
      symbol: "1C26TAA",
      customer: "Nguyễn Văn A",
      amount: 45000,
      taxAmount: 3600,
      finalAmount: 48600,
      status: "WAITING_TAX_CODE",
      taxAuthorityCode: "-",
      time: "2026-07-15 10:05:00",
    },
    {
      id: "inv4",
      lookupCode: "HD-VT004",
      symbol: "1C26TAA",
      customer: "Khách vãng lai",
      amount: 80000,
      taxAmount: 6400,
      finalAmount: 86400,
      status: "DRAFT",
      taxAuthorityCode: "-",
      time: "2026-07-15 10:22:15",
    },
  ]);

  const [customers, setCustomers] = useState<ICustomer[]>([
    {
      id: "c1",
      name: "Nguyễn Văn A",
      phone: "0987654321",
      email: "anv@gmail.com",
      creditLimit: 5000000,
      debt: 0,
    },
    {
      id: "c2",
      name: "Trần Thị B",
      phone: "0901234567",
      email: "btt@gmail.com",
      creditLimit: 3000000,
      debt: 500000,
    },
    {
      id: "c3",
      name: "Lê Hoàng Nam",
      phone: "0912345678",
      email: "namlh@gmail.com",
      creditLimit: 10000000,
      debt: 1200000,
    },
  ]);

  const [logs, setLogs] = useState<ILog[]>([
    {
      id: "l1",
      time: "2026-07-15 10:15:30",
      user: "nhanvien_viet",
      action: "ĐĂNG_NHẬP",
      target: "Thiết bị điểm bán POS-01",
    },
    {
      id: "l2",
      time: "2026-07-15 09:54:12",
      user: "chuho_viet",
      action: "CẬP_NHẬT_CẤU_HÌNH",
      target: "Mẫu hóa đơn GTGT (1C26TAA)",
    },
    {
      id: "l3",
      time: "2026-07-15 09:30:12",
      user: "nhanvien_viet",
      action: "PHÁT_HÀNH_HÓA_ĐƠN",
      target: "Đơn hàng HD-VT002 (Khách hàng Trần Thị B)",
    },
  ]);

  // --- EMPLOYEE STATE DECLARATIONS ---
  const defaultRoles: IRole[] = [
    { id: "r1", code: "VT-01", name: "Chủ hộ kinh doanh", description: "Chủ hộ kinh doanh quản lý toàn bộ hệ thống" },
    { id: "r2", code: "VT-02", name: "Nhân viên bán hàng", description: "Nhân viên bán hàng trực ca" },
    { id: "r3", code: "VT-03", name: "Kế toán viên", description: "Kế toán đối chiếu hóa đơn thuế" },
  ];

  const { data: employees = [] } = useGetAllEmployeesQuery();

  const [roles] = useState<IRole[]>(defaultRoles);

  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");
  const [employeeSelectedRole, setEmployeeSelectedRole] = useState("ALL");

  const addLogEntry = (action: string, target: string) => {
    setLogs((prev) => [
      {
        id: "l" + (prev.length + 1),
        time: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user?.username || "chuho_viet",
        action,
        target,
      },
      ...prev,
    ]);
  };

  const handleCancelInvoice = (id: string) => {
    const reason = prompt("Nhập lý do hủy hóa đơn (Bắt buộc theo QTN-05):");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Lỗi: Không được để trống lý do hủy hóa đơn!");
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          return { ...inv, status: "CANCELED" as const };
        }
        return inv;
      })
    );

    const targetInv = invoices.find((inv) => inv.id === id);
    addLogEntry(
      "HỦY_HÓA_ĐƠN",
      `Mã HĐ: ${targetInv?.lookupCode || id} - Lý do: "${reason}"`
    );

    alert(`Đã hủy hóa đơn thành công!`);
  };

  const handleAdjustInvoice = (id: string) => {
    const targetInv = invoices.find((inv) => inv.id === id);
    if (!targetInv) return;

    const adjustDetail = prompt(
      `Nhập chi tiết điều chỉnh cho hóa đơn ${targetInv.lookupCode} (QTN-12):`,
      "Điều chỉnh giảm giá trị mặt hàng do áp dụng nhầm mức thuế..."
    );
    if (adjustDetail === null) return;
    if (!adjustDetail.trim()) {
      alert("Lỗi: Không được để trống chi tiết điều chỉnh hóa đơn!");
      return;
    }

    setInvoices((prev) => {
      const updated = prev.map((inv) => {
        if (inv.id === id) {
          return { ...inv, status: "ADJUSTED" as const };
        }
        return inv;
      });

      const newAdjustId = `inv_adj_${Date.now()}`;
      const newAdjustCode = `HĐDC-${targetInv.lookupCode}`;
      const newAdjustInvoice: IInvoice = {
        id: newAdjustId,
        lookupCode: newAdjustCode,
        symbol: targetInv.symbol,
        customer: targetInv.customer,
        amount: targetInv.amount,
        taxAmount: targetInv.taxAmount,
        finalAmount: targetInv.finalAmount,
        status: "ISSUED" as const,
        taxAuthorityCode: `CQT-DC-${Date.now().toString().slice(-6)}`,
        time: new Date().toISOString().replace("T", " ").substring(0, 19),
      };

      return [...updated, newAdjustInvoice];
    });

    addLogEntry(
      "LẬP_HĐ_ĐIỀU_CHỈNH",
      `Mã HĐĐC: HĐDC-${targetInv.lookupCode} - Tham chiếu gốc: ${targetInv.lookupCode} - Chi tiết: "${adjustDetail}"`
    );

    alert(`Đã lập hóa đơn điều chỉnh thành công! Tham chiếu đến hóa đơn gốc: ${targetInv.lookupCode}`);
  };

  // Form submit handlers (simulated local changes)
  const handleAddStock = async (values: GoodsReceiptFormValues) => {
    const prodId = values.productId;
    const qty = values.quantity;
    const price = values.purchasePrice;
    const selectedProd = dbProducts.find((p) => p.id === prodId);
    if (!selectedProd) throw new Error("Hàng hóa không tồn tại");

    const receiptNumber = values.receiptNumber.trim() || `NK-${Date.now()}`;

    const newEntry: IStockEntry = {
      id: receiptNumber,
      time: values.receivedAt.replace("T", " ") + ":00",
      sku: selectedProd.sku,
      name: selectedProd.name,
      qty,
      importPrice: price,
      total: qty * price,
      notes: values.notes,
    };

    try {
      await updateProduct({
        id: selectedProd.id,
        data: {
          sku: selectedProd.sku,
          name: selectedProd.name,
          unit: selectedProd.unit,
          price: selectedProd.price,
          stockQuantity: selectedProd.stockQuantity + qty,
          taxRateId: selectedProd.taxRateId,
          status: selectedProd.status,
        },
      }).unwrap();

      setStockEntries([newEntry, ...stockEntries]);
      setLogs([
        {
          id: "l" + (logs.length + 1),
          time: new Date().toISOString().replace("T", " ").substring(0, 19),
          user: user?.username || "chuho_viet",
          action: "NHẬP_KHO",
          target: `Sản phẩm ${selectedProd.name} (+${qty} ${selectedProd.unit})`,
        },
        ...logs,
      ]);
      alert("Lập phiếu nhập kho và cập nhật tồn kho thành công!");
    } catch (err: any) {
      alert("Lỗi nhập kho: " + (err?.data?.message || "Không thể cập nhật tồn kho!"));
      throw err;
    }
  };

  const handleOpenShift = () => {
    const timeStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    const newShift: IShift = {
      id: "s" + (shifts.length + 1),
      user: user?.username || "chuho_viet",
      openTime: timeStr,
      closeTime: "--",
      openingCash: openingCashInput,
      expectedCash: openingCashInput,
      actualCash: 0,
      difference: 0,
      status: "OPEN",
    };
    setCurrentShift(newShift);
    setClosingActualInput(openingCashInput);
    setClosingReason("");
    setLogs([
      {
        id: "l" + (logs.length + 1),
        time: timeStr,
        user: user?.username || "chuho_viet",
        action: "MỞ_CA",
        target: `Mở ca mới với số tiền quỹ két ban đầu: ${openingCashInput.toLocaleString("vi-VN")} đ`,
      },
      ...logs,
    ]);
  };

  const handleCloseShift = () => {
    if (!currentShift) return;
    const timeStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    const diff = closingActualInput - currentShift.expectedCash;
    const updatedShift: IShift = {
      ...currentShift,
      closeTime: timeStr,
      actualCash: closingActualInput,
      difference: diff,
      status: "CLOSED",
      reason: diff !== 0 ? closingReason : undefined,
    };
    setShifts([updatedShift, ...shifts]);
    setCurrentShift(null);
    setLogs([
      {
        id: "l" + (logs.length + 1),
        time: timeStr,
        user: user?.username || "chuho_viet",
        action: "ĐÓNG_CA",
        target: `Đóng ca. Đếm thực tế: ${closingActualInput.toLocaleString("vi-VN")} đ. Chênh lệch: ${diff.toLocaleString("vi-VN")} đ`,
      },
      ...logs,
    ]);
  };

  const handleAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const newCust: ICustomer = {
      id: "c" + (customers.length + 1),
      name: data.get("name") as string,
      phone: data.get("phone") as string,
      email: data.get("email") as string,
      creditLimit: Number(data.get("creditLimit")),
      debt: 0,
    };
    setCustomers([...customers, newCust]);
    setLogs([
      {
        id: "l" + (logs.length + 1),
        time: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user?.username || "chuho_viet",
        action: "THÊM_KHÁCH_HÀNG",
        target: `Khách hàng mới: ${newCust.name} (SĐT: ${newCust.phone})`,
      },
      ...logs,
    ]);
    e.currentTarget.reset();
  };

  // Helper format currency
  const formatCurrency = (val: number) => {
    return val.toLocaleString("vi-VN") + " đ";
  };

  // KPI Calculations
  const totalRevenueToday = invoices
    .filter((inv) => inv.status === "ISSUED" && inv.time.startsWith("2026-07-15"))
    .reduce((sum, inv) => sum + inv.finalAmount, 0);

  const totalInvoiceCountToday = invoices.filter(
    (inv) => inv.status === "ISSUED" && inv.time.startsWith("2026-07-15")
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 text-xs font-sans select-none">
      
      {/* ====== LAYER 1: Utility Bar ====== */}
      <div className="min-h-11 bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-[11px] shrink-0 font-medium">
        <div className="flex items-center gap-2 min-w-0">
          {/* Logo brand */}
          <div className="flex items-center text-kv-blue-primary font-extrabold text-sm tracking-wide gap-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span className="hidden sm:inline">
              Bán Hàng<strong className="text-slate-800 font-extrabold">Việt</strong>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-300 font-normal">|</span>
          <span className="hidden sm:inline text-slate-500 font-bold truncate">Demo Trải nghiệm Nghiệp vụ</span>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2 lg:gap-4 min-w-0">
          {/* Role display */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
            <span className="hidden md:inline text-slate-500">Vai trò:</span>
            <select
              value={currentRole}
              onChange={(e) => {
                const newRole = e.target.value;
                setCurrentRole(newRole);
                if (newRole === "VT-02") {
                  setActiveTab("dashboard");
                } else if (newRole === "VT-03" && activeTab === "shifts") {
                  setActiveTab("dashboard");
                }
              }}
              className="font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer text-[11px] max-w-28 sm:max-w-44"
            >
              <option value="VT-01">{getRoleName("VT-01")}</option>
              <option value="VT-02">{getRoleName("VT-02")}</option>
              <option value="VT-03">{getRoleName("VT-03")}</option>
              <option value="VT-04">{getRoleName("VT-04")}</option>
              <option value="VT-05">{getRoleName("VT-05")}</option>
            </select>
          </div>

          {/* Network Connection Badge */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md border transition-all ${
              isOnline
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-rose-50 text-rose-600 border-rose-200"
            }`}
            title="Nhấp để chuyển trạng thái mạng"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            ></span>
            <span className="hidden sm:inline">{isOnline ? "ONLINE" : "OFFLINE"}</span>
          </button>

          {/* Conflict Simulation Toggle */}
          <div className="hidden xl:flex items-center gap-1.5 bg-rose-50/50 border border-rose-200/60 px-2.5 py-1 rounded-md font-semibold text-rose-700">
            <input
              type="checkbox"
              id="conflict-toggle"
              checked={simConflict}
              onChange={(e) => setSimConflict(e.target.checked)}
              className="cursor-pointer rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-3 h-3"
            />
            <label htmlFor="conflict-toggle" className="cursor-pointer">
              Mô phỏng xung đột offline
            </label>
          </div>

          {/* User greetings */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-md font-bold text-slate-700">
            <span>Xin chào, {household?.name || "Chủ hộ Tạp Hóa Việt"}</span>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-800 transition-colors font-extrabold"
            >
              Đăng xuất
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-md hover:bg-slate-900 transition-all shadow-sm"
          >
            <span className="hidden sm:inline">✕ Thoát Demo</span>
            <span className="sm:hidden">Thoát</span>
          </button>
        </div>
      </div>

      {/* ====== LAYER 2: Blue Navigation Bar ====== */}
      <div className="h-10 bg-kv-blue-primary text-white flex items-center px-2 sm:px-4 justify-between shadow-md shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Mở bộ lọc và chức năng"
          className="lg:hidden shrink-0 w-8 h-8 rounded-md hover:bg-kv-blue-dark flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center h-full overflow-x-auto flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "dashboard", label: "Tổng quan" },
            { id: "products", label: "Hàng hóa" },
            { id: "shifts", label: "Ca bán hàng" },
            { id: "invoices", label: "Đơn hàng" },
            { id: "customers", label: "Khách hàng" },
            { id: "employees", label: "Nhân viên" },
            { id: "reports", label: "Báo cáo" },
            { id: "config", label: "Cấu hình" },
          ].filter((tab) => isTabVisible(tab.id)).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsMobileSidebarOpen(false);
              }}
              className={`h-full px-3 sm:px-5 shrink-0 flex items-center gap-1.5 font-bold hover:bg-kv-blue-dark transition-colors border-b-2 text-xs leading-none ${
                activeTab === tab.id
                  ? "bg-white text-kv-blue-primary border-white"
                  : "border-transparent text-white/95"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sell button */}
        <button
          onClick={() => alert("Chức năng mở quầy bán hàng POS sẽ được điều hướng tới màn hình bán lẻ.")}
          className="bg-kv-green hover:bg-emerald-600 transition-colors px-2.5 sm:px-4 h-7 shrink-0 text-[11px] font-bold text-white rounded-md flex items-center gap-1.5 shadow-sm"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M2.57 7.57a2 2 0 0 1 1.44-.57H20a2 2 0 0 1 1.94 2.5l-2 8A2 2 0 0 1 18 19H6a2 2 0 0 1-1.94-1.5l-2-8A2 2 0 0 1 2.57 7.57zM16 11a4 4 0 0 1-8 0" />
          </svg>
          Bán hàng
        </button>
      </div>

      {/* ====== WORKSPACE: Sidebar + Main Content ====== */}
      <div className="flex-1 flex overflow-hidden">
        {isMobileSidebarOpen && (
          <button
            type="button"
            aria-label="Đóng bộ lọc và chức năng"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          />
        )}
        
        {/* Left Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 p-4 pt-12 shrink-0 flex flex-col gap-5 overflow-y-auto shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:translate-x-0 lg:border lg:rounded-xl lg:my-3 lg:ml-3 lg:p-4 lg:shadow-sm ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Đóng bộ lọc và chức năng"
            className="lg:hidden absolute top-3 right-3 w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 flex items-center justify-center"
          >
            ✕
          </button>
          {currentRole === "VT-04" ? (
            <>
              <div className="font-extrabold text-sm text-slate-800 border-b pb-2">Quản trị nền tảng</div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setAdminTab("overview")}
                  className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                    adminTab === "overview"
                      ? "bg-kv-blue-light text-kv-blue-primary"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Tổng quan hệ thống
                </button>
                <button
                  onClick={() => setAdminTab("households")}
                  className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                    adminTab === "households"
                      ? "bg-kv-blue-light text-kv-blue-primary"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Hộ kinh doanh (12)
                </button>
                <button
                  onClick={() => setAdminTab("logs")}
                  className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                    adminTab === "logs"
                      ? "bg-kv-blue-light text-kv-blue-primary"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Nhật ký hệ thống
                </button>
              </div>
            </>
          ) : currentRole === "VT-05" ? (
            <>
              <div className="font-extrabold text-sm text-slate-800 border-b pb-2">Cổng cơ quan thuế</div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setTaxTab("invoices")}
                  className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                    taxTab === "invoices"
                      ? "bg-kv-blue-light text-kv-blue-primary"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Duyệt cấp mã hóa đơn
                </button>
                <button
                  onClick={() => setTaxTab("config")}
                  className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                    taxTab === "config"
                      ? "bg-kv-blue-light text-kv-blue-primary"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Cấu hình tiếp nhận
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Active Tab: Dashboard */}
          {activeTab === "dashboard" && (
            <>
              <div className="font-extrabold text-sm text-slate-800 border-b pb-2">Tổng quan</div>
              <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Thời gian đối chiếu
                </span>
                <div className="flex flex-col gap-2 font-medium">
                  {["Tháng này", "Tháng trước", "7 ngày qua"].map((time) => (
                    <label key={time} className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="dashTime"
                        checked={dashTimeFilter === time}
                        onChange={() => setDashTimeFilter(time)}
                        className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                      />
                      <span>{time}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Điểm kinh doanh
                </span>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-semibold text-slate-700 focus:outline-none focus:border-kv-blue-primary">
                  <option>Chi nhánh chính</option>
                </select>
              </div>
            </>
          )}

          {/* Active Tab: Products */}
          {activeTab === "products" && (
            <div className="flex flex-col gap-4">
              <div className="font-extrabold text-sm text-slate-800 border-b pb-2">Hàng hóa</div>
              <div className="flex flex-col gap-2">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Danh mục chức năng
                </span>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setProductSubTab("list")}
                    className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                      productSubTab === "list"
                        ? "bg-kv-blue-light text-kv-blue-primary"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    Danh mục hàng hóa
                  </button>
                  {canViewGoodsReceipts && (
                    <button
                      onClick={() => setProductSubTab("stock-entry")}
                      className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                        productSubTab === "stock-entry"
                          ? "bg-kv-blue-light text-kv-blue-primary"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      Nhập kho hàng hóa
                    </button>
                  )}
                </div>
              </div>
              {productSubTab === "list" && (
                <div className="border-t pt-4">
                  <ProductSidebar
                    selectedGroup={prodGroupFilter}
                    setSelectedGroup={setProdGroupFilter}
                    stockFilter={prodStockFilter}
                    setStockFilter={setProdStockFilter}
                    userRole={currentRole}
                  />
                </div>
              )}
            </div>
          )}

          {/* Active Tab: Shifts */}
          {activeTab === "shifts" && (
            <>
              <div className="font-extrabold text-sm text-slate-800 border-b pb-2">Ca bán hàng</div>
              <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Trạng thái ca
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Tất cả", "Đang mở", "Đã đóng"].map((st) => (
                    <span
                      key={st}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Thời gian
                </span>
                <div className="flex flex-col gap-2 font-medium">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="shiftTime"
                      defaultChecked
                      className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                    />
                    <span>Tháng này</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="radio"
                      name="shiftTime"
                      className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                    />
                    <span>Tùy chỉnh</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Active Tab: Invoices */}
          {activeTab === "invoices" && (
            <>
              <div className="font-extrabold text-sm text-slate-800 border-b pb-2">Hóa đơn</div>
              <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Trạng thái hóa đơn
                </span>
                <div className="flex flex-col gap-2 font-medium text-slate-700">
                  {["Đang xử lý", "Hoàn thành", "Không giao được", "Đã hủy"].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={status === "Hoàn thành" || status === "Đang xử lý"}
                        className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Thời gian giao hàng
                </span>
                <div className="flex flex-col gap-2 font-medium text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invTime"
                      defaultChecked
                      className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                    />
                    <span>Toàn thời gian</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invTime"
                      className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                    />
                    <span>Tùy chỉnh</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Active Tab: Customers */}
          {activeTab === "customers" && (
            <>
              <div className="font-extrabold text-sm text-slate-800 border-b pb-2">Khách hàng</div>
              <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Loại khách hàng
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-kv-blue-light text-kv-blue-primary font-bold px-2 py-1 rounded cursor-pointer">
                    Tất cả
                  </span>
                  <span className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer">
                    Cá nhân
                  </span>
                  <span className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer">
                    Công ty
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Giới tính
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-kv-blue-light text-kv-blue-primary font-bold px-2 py-1 rounded cursor-pointer">
                    Tất cả
                  </span>
                  <span className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer">
                    Nam
                  </span>
                  <span className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer">
                    Nữ
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Active Tab: Employees */}
          {activeTab === "employees" && (
            <EmployeeSidebar
              statusFilter={employeeStatusFilter}
              setStatusFilter={setEmployeeStatusFilter}
              selectedRole={employeeSelectedRole}
              setSelectedRole={setEmployeeSelectedRole}
              roles={roles}
            />
          )}

          {/* Active Tab: Reports */}
          {activeTab === "reports" && (
            <>
              <div className="font-extrabold text-sm text-slate-800 border-b pb-2">Báo cáo</div>
              <div className="flex flex-col gap-2">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Chức năng báo cáo
                </span>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setReportSubTab("revenue")}
                    className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                      reportSubTab === "revenue"
                        ? "bg-kv-blue-light text-kv-blue-primary"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    Doanh thu &amp; Bán chạy
                  </button>
                  <button
                    onClick={() => setReportSubTab("comparison")}
                    className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                      reportSubTab === "comparison"
                        ? "bg-kv-blue-light text-kv-blue-primary"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    So sánh doanh thu kỳ
                  </button>
                  <button
                    onClick={() => setReportSubTab("logs")}
                    className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                      reportSubTab === "logs"
                        ? "bg-kv-blue-light text-kv-blue-primary"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    Nhật ký hoạt động
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Active Tab: Config */}
          {activeTab === "config" && (
            <>
              <div className="font-extrabold text-sm text-slate-800 border-b pb-2">Cấu hình</div>
              <div className="flex flex-col gap-2">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
                  Danh mục cấu hình
                </span>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setConfigSubTab("info")}
                    className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                      configSubTab === "info"
                        ? "bg-kv-blue-light text-kv-blue-primary"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    Thông tin cửa hàng
                  </button>
                  <button
                    onClick={() => setConfigSubTab("tax")}
                    className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                      configSubTab === "tax"
                        ? "bg-kv-blue-light text-kv-blue-primary"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    Thuế suất
                  </button>
                  <button
                    onClick={() => setConfigSubTab("printer")}
                    className={`w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
                      configSubTab === "printer"
                        ? "bg-kv-blue-light text-kv-blue-primary"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    Cấu hình máy in
                  </button>

                </div>
              </div>
            </>
          )}
          </>
          )}
        </aside>

        {/* Right Main Content Panel */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 overflow-y-auto bg-slate-50">
          {currentRole === "VT-04" ? (
            /* ==================== VT-04: PLATFORM ADMIN VIEW ==================== */
            <div className="flex flex-col gap-6">
              {/* Header Info */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Cổng Quản Trị Hệ Thống (Platform Admin)</h2>
                  <p className="text-slate-500 text-xs mt-1">Quản lý các tài khoản Hộ kinh doanh và theo dõi hoạt động toàn hệ thống.</p>
                </div>
                <div className="bg-kv-blue-light text-kv-blue-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200">
                  Vai trò quản trị tối cao (VT-04)
                </div>
              </div>

              {/* KPI cards */}
              {adminTab === "overview" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hộ kinh doanh</div>
                      <div className="text-2xl font-extrabold text-slate-800 mt-1">12 hộ</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-1">🟢 11 đang hoạt động / 🔴 1 bị khóa</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tài khoản hoạt động</div>
                      <div className="text-2xl font-extrabold text-slate-800 mt-1">45 users</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-1">Đồng bộ tức thời</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng hóa đơn truyền nhận</div>
                      <div className="text-2xl font-extrabold text-slate-800 mt-1">12.540 HĐ</div>
                      <div className="text-[10px] text-indigo-600 font-bold mt-1">Đã ký &amp; cấp mã số thuế</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái API Gateway</div>
                      <div className="text-2xl font-extrabold text-emerald-600 mt-1">99.98%</div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">Hoạt động bình thường</div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-4">Biểu đồ tải truyền nhận hóa đơn điện tử</h3>
                    <div className="h-[200px] flex items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
                      <span className="font-bold">📊 Biểu đồ trực quan phụ tải Cloud Gateway (Thiết kế giả lập)</span>
                    </div>
                  </div>
                </>
              )}

              {/* Households list tab */}
              {adminTab === "households" && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-2">Danh sách Hộ kinh doanh trên nền tảng</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-3">Hộ kinh doanh</th>
                          <th className="p-3">Mã số thuế</th>
                          <th className="p-3">Người đại diện</th>
                          <th className="p-3">Gói dịch vụ</th>
                          <th className="p-3">Hạn sử dụng</th>
                          <th className="p-3 text-center">Trạng thái</th>
                          <th className="p-3 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Tạp Hóa Việt</td>
                          <td className="p-3 font-mono font-bold">0123456789</td>
                          <td className="p-3">Nguyễn Văn A</td>
                          <td className="p-3"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">Premium</span></td>
                          <td className="p-3">15/12/2026</td>
                          <td className="p-3 text-center"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Hoạt động</span></td>
                          <td className="p-3 text-center">
                            <button onClick={() => alert("Khóa hộ kinh doanh Tạp Hóa Việt")} className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold text-[10px]">Khóa</button>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Nhà Thuốc An Tâm</td>
                          <td className="p-3 font-mono font-bold">0312456789</td>
                          <td className="p-3">Phạm Thị B</td>
                          <td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Standard</span></td>
                          <td className="p-3">01/10/2026</td>
                          <td className="p-3 text-center"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Hoạt động</span></td>
                          <td className="p-3 text-center">
                            <button onClick={() => alert("Khóa hộ kinh doanh Nhà Thuốc An Tâm")} className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold text-[10px]">Khóa</button>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Quán ăn Hương Quê</td>
                          <td className="p-3 font-mono font-bold">0412356789</td>
                          <td className="p-3">Lê Văn C</td>
                          <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">Trial</span></td>
                          <td className="p-3 text-rose-500 font-bold">Hết hạn (01/07/2026)</td>
                          <td className="p-3 text-center"><span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">Bị khóa</span></td>
                          <td className="p-3 text-center">
                            <button onClick={() => alert("Gia hạn và kích hoạt lại hộ Quán ăn Hương Quê")} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold text-[10px]">Gia hạn (+1 năm)</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Logs tab */}
              {adminTab === "logs" && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-2">Nhật ký Hệ thống mức Quản trị</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-3">Thời gian</th>
                          <th className="p-3">Đối tượng</th>
                          <th className="p-3">Hành động</th>
                          <th className="p-3">Địa chỉ IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        <tr>
                          <td className="p-3">2026-07-15 10:52:14</td>
                          <td className="p-3 font-bold text-indigo-600">quantri_viet (VT-04)</td>
                          <td className="p-3 text-slate-800">Đăng nhập cổng quản trị nền tảng</td>
                          <td className="p-3">192.168.1.100</td>
                        </tr>
                        <tr>
                          <td className="p-3">2026-07-15 10:45:00</td>
                          <td className="p-3 font-bold text-slate-800">chuho_viet (VT-01)</td>
                          <td className="p-3 text-slate-500">Gửi ký hóa đơn điện tử HD-VT004</td>
                          <td className="p-3">14.232.84.102</td>
                        </tr>
                        <tr>
                          <td className="p-3">2026-07-15 10:45:02</td>
                          <td className="p-3 font-bold text-emerald-600">thue_viet (VT-05)</td>
                          <td className="p-3 text-emerald-700">Trả kết quả cấp mã CQT-20260715-00127D</td>
                          <td className="p-3">10.20.1.5</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : currentRole === "VT-05" ? (
            /* ==================== VT-05: TAX AUTHORITY VIEW ==================== */
            <div className="flex flex-col gap-6">
              {/* Header Info */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Cổng Tiếp Nhận &amp; Cấp Mã Hóa Đơn Điện Tử</h2>
                  <p className="text-slate-500 text-xs mt-1">Mô phỏng quy trình xử lý hóa đơn, cấp mã số thuế tự động hoặc thủ công từ điểm bán.</p>
                </div>
                <div className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200">
                  Cơ quan thuế Mô phỏng (VT-05)
                </div>
              </div>

              {taxTab === "invoices" && (
                <>
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng hóa đơn tiếp nhận</div>
                      <div className="text-2xl font-extrabold text-slate-800 mt-1">
                        {invoices.length} hóa đơn
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-semibold">Tự động bắt gói từ hàng đợi</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hóa đơn đã cấp mã thành công</div>
                      <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                        {invoices.filter(i => i.status === "ISSUED").length} hóa đơn
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">Tỷ lệ duyệt cấp mã: 100%</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hóa đơn chờ cấp mã (WAITING)</div>
                      <div className="text-2xl font-extrabold text-amber-600 mt-1">
                        {invoices.filter(i => i.status === "WAITING_TAX_CODE").length} hóa đơn
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-semibold">Cần duyệt thủ công phía dưới</div>
                    </div>
                  </div>

                  {/* List of invoices awaiting validation */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-2">
                      Danh sách hóa đơn được truyền tới Cơ quan Thuế
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                            <th className="p-3">Mã hóa đơn</th>
                            <th className="p-3">Khách hàng</th>
                            <th className="p-3 text-right">Tổng thanh toán</th>
                            <th className="p-3 text-center">Trạng thái thuế</th>
                            <th className="p-3">Mã cơ quan thuế cấp</th>
                            <th className="p-3 text-center">Thao tác cơ quan thuế</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-800">{inv.lookupCode}</td>
                              <td className="p-3 text-slate-700 font-bold">{inv.customer}</td>
                              <td className="p-3 text-right font-bold text-kv-blue-primary">{formatCurrency(inv.finalAmount)}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  inv.status === "ISSUED" ? "bg-emerald-100 text-emerald-700" :
                                  inv.status === "WAITING_TAX_CODE" ? "bg-amber-100 text-amber-700" :
                                  inv.status === "SEND_ERROR" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {inv.status === "ISSUED" ? "Đã cấp mã" :
                                   inv.status === "WAITING_TAX_CODE" ? "Chờ cấp mã" :
                                   inv.status === "SEND_ERROR" ? "Lỗi thuế/Từ chối" : "Khởi tạo"}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-xs text-slate-500">{inv.taxAuthorityCode}</td>
                              <td className="p-3 text-center">
                                {inv.status === "WAITING_TAX_CODE" ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setInvoices(prev => prev.map(item => {
                                          if (item.id === inv.id) {
                                            return {
                                              ...item,
                                              status: "ISSUED" as const,
                                              taxAuthorityCode: `CQT-20260715-${Math.floor(100000 + Math.random() * 900000)}`
                                            };
                                          }
                                          return item;
                                        }));
                                        addLogEntry("THUẾ_CẤP_MÃ", `Cơ quan thuế duyệt cấp mã cho hóa đơn ${inv.lookupCode}`);
                                        alert("Đã cấp mã hóa đơn thành công!");
                                      }}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[10px]"
                                    >
                                      Cấp mã thuế
                                    </button>
                                    <button
                                      onClick={() => {
                                        setInvoices(prev => prev.map(item => {
                                          if (item.id === inv.id) {
                                            return {
                                              ...item,
                                              status: "SEND_ERROR" as const,
                                              taxAuthorityCode: "-"
                                            };
                                          }
                                          return item;
                                        }));
                                        addLogEntry("THUẾ_TỪ_CHỐI", `Cơ quan thuế từ chối cấp mã cho hóa đơn ${inv.lookupCode}`);
                                        alert("Đã từ chối cấp mã!");
                                      }}
                                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded text-[10px]"
                                    >
                                      Từ chối
                                    </button>
                                  </div>
                                ) : inv.status === "ISSUED" ? (
                                  <span className="text-emerald-600 text-[10px] font-bold">🟢 Đã duyệt thành công</span>
                                ) : (
                                  <span className="text-slate-400 text-[10px] font-semibold italic">Không cần thao tác</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {taxTab === "config" && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-2">Cấu hình tham số tiếp nhận mô phỏng</h3>
                  <div className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
                    <div className="flex items-center gap-2 py-1">
                      <input type="checkbox" id="auto-cert" defaultChecked className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4" />
                      <label htmlFor="auto-cert" className="cursor-pointer font-bold">Tự động duyệt cấp mã ngay lập tức cho các hóa đơn DRAFT gửi lên</label>
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <input type="checkbox" id="tax-strict" defaultChecked className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4" />
                      <label htmlFor="tax-strict" className="cursor-pointer font-bold">Bắt buộc hóa đơn phải có ký hiệu và mẫu số hợp lệ (QTN-02)</label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ==================== NORMAL SHOP MANAGEMENT VIEWS (VT-01, VT-02, VT-03) ==================== */
            <>
              {/* PANE 1: TỔNG QUAN (DASHBOARD) */}
              {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              
              {/* Left Side KPI + Chart */}
              <div className="xl:col-span-3 flex flex-col gap-6">
                
                {/* KPI cards */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-extrabold text-slate-800 text-sm mb-4">
                    Kết quả bán hàng hôm nay
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Doanh thu</div>
                        <div className="text-xl font-extrabold text-slate-800">
                          {formatCurrency(currentRole === "VT-02" ? 86400 : totalRevenueToday)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {currentRole === "VT-02" ? 1 : totalInvoiceCountToday} hóa đơn {currentRole === "VT-02" ? "của bạn" : "đã ký cấp mã"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trả hàng</div>
                        <div className="text-xl font-extrabold text-slate-800">0</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          0 phiếu trả hàng
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SVG Revenue Chart */}
                {currentRole === "VT-02" ? (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center text-slate-500 font-semibold min-h-[294px]">
                    <svg className="w-12 h-12 text-rose-500 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span className="text-sm font-extrabold text-slate-700 mb-1">Chặn truy cập dữ liệu doanh thu tổng hợp (QTN-10)</span>
                    <span className="text-[11px] text-slate-500 max-w-[420px] leading-relaxed font-medium">
                      Theo quy tắc bảo mật <strong>QTN-10</strong>, Nhân viên bán hàng chỉ được xem số liệu đơn của chính mình trong ca, không được quyền truy cập biểu đồ phân tích doanh thu tổng hợp của cửa hàng.
                    </span>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                      <span className="font-extrabold text-slate-800 text-sm">
                        Doanh thu thuần: <span className="text-kv-blue-primary">{formatCurrency(totalRevenueToday)}</span>
                      </span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border">
                        {[
                          { id: "day", label: "Theo ngày" },
                          { id: "hour", label: "Theo giờ" },
                          { id: "week", label: "Theo thứ" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setChartSubTab(tab.id as any)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                              chartSubTab === tab.id
                                ? "bg-white text-kv-blue-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 h-[240px] flex items-center justify-center relative bg-slate-50/20">
                      {/* SVG Graphic representation of empty / sample chart */}
                      <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                        {/* Grid Lines */}
                        <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="60" x2="580" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="100" x2="580" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="140" x2="580" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="180" x2="580" y2="180" stroke="#cbd5e1" strokeWidth="1" />

                        {/* Y-axis Labels */}
                        <text x="15" y="24" fill="#94a3b8" fontSize="9" fontWeight="bold">1,0</text>
                        <text x="15" y="64" fill="#94a3b8" fontSize="9" fontWeight="bold">0,8</text>
                        <text x="15" y="104" fill="#94a3b8" fontSize="9" fontWeight="bold">0,6</text>
                        <text x="15" y="144" fill="#94a3b8" fontSize="9" fontWeight="bold">0,4</text>
                        <text x="15" y="184" fill="#94a3b8" fontSize="9" fontWeight="bold">0,0</text>

                        {/* X-axis ticks & date */}
                        <text x="310" y="196" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">
                          2026-07-15 (nhanvien_viet)
                        </text>

                        {/* If revenue today > 0, show a bar indicator for today */}
                        {totalRevenueToday > 0 ? (
                          <g>
                            <rect
                              x="280"
                              y="40"
                              width="60"
                              height="140"
                              rx="4"
                              fill="url(#chartGrad)"
                              className="transition-all duration-300"
                            />
                            <text x="310" y="32" fill="#0068FF" fontSize="9" fontWeight="bold" textAnchor="middle">
                              {formatCurrency(totalRevenueToday)}
                            </text>
                          </g>
                        ) : (
                          <text x="310" y="100" fill="#94a3b8" fontSize="11" fontWeight="semibold" textAnchor="middle">
                            Chưa có giao dịch doanh thu trong ca hoạt động
                          </text>
                        )}

                        {/* Gradients */}
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0068FF" stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#0068FF" stopOpacity="0.2" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Side Widgets */}
              <div className="xl:col-span-1 flex flex-col gap-6">
                
                {/* Quick Access Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 font-extrabold text-slate-800">
                    Truy cập nhanh
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {[
                      { tab: "pos", label: "Màn hình bán hàng (POS)", icon: "🛒" },
                      { tab: "invoices", label: "Tra cứu hóa đơn", icon: "📄" },
                      { tab: "shifts", label: "Quản lý ca bán hàng", icon: "🕒" },
                    ].map((item) => (
                      <button
                        key={item.tab}
                        onClick={() => {
                          if (item.tab === "pos") {
                            alert("Đang mở quầy bán hàng POS...");
                          } else {
                            setActiveTab(item.tab as any);
                          }
                        }}
                        className="flex items-center justify-between border border-slate-200 hover:bg-slate-50 transition-colors p-3 rounded-lg font-bold text-slate-700"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        <span className="text-slate-400">›</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                  <div className="p-4 border-b border-slate-100 font-extrabold text-slate-800">
                    Hoạt động gần đây
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-center items-center text-slate-400 text-center">
                    <svg
                      className="w-10 h-10 text-slate-300 mb-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                      />
                    </svg>
                    <span className="font-semibold text-[11px]">Chưa có hoạt động mới</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* PANE 2: HÀNG HÓA */}
          {activeTab === "products" && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              
              {/* Product Subtab List */}
              {productSubTab === "list" && (
                <div className="xl:col-span-4 animate-auth-fade-in">
                  <ProductList
                    userRole={currentRole}
                    selectedGroup={prodGroupFilter}
                    stockFilter={prodStockFilter}
                  />
                </div>
              )}

              {/* Product Subtab Stock entry */}
              {productSubTab === "stock-entry" && canViewGoodsReceipts && (
                <>
                  <div className="xl:col-span-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-auth-fade-in">
                    <div className="relative flex-1 max-w-md">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                      </span>
                      <input
                        type="search"
                        value={stockEntrySearch}
                        onChange={(event) => setStockEntrySearch(event.target.value)}
                        placeholder="Theo mã phiếu, tên hàng, SKU"
                        aria-label="Tìm kiếm phiếu nhập kho"
                        className="w-full pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 shadow-sm transition-all"
                      />
                    </div>

                    {canCreateGoodsReceipt && (
                      <button
                        type="button"
                        onClick={() => setIsGoodsReceiptModalOpen(true)}
                        className="font-bold px-4 h-9 rounded-lg flex items-center gap-1.5 text-xs transition-all bg-kv-blue-primary hover:bg-kv-blue-dark text-white shadow-sm"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Nhập kho
                      </button>
                    )}
                  </div>

                  <div className="xl:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-auth-fade-in">
                    <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
                      Lịch sử Phiếu nhập kho (stock_entries)
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                            <th className="p-3">Mã phiếu</th>
                            <th className="p-3">Thời gian nhập</th>
                            <th className="p-3">Sản phẩm (SKU)</th>
                            <th className="p-3 text-right">Số lượng</th>
                            <th className="p-3 text-right">Giá nhập</th>
                            <th className="p-3 text-right">Thành tiền</th>
                            <th className="p-3">Ghi chú / NCC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {filteredStockEntries.map((se) => (
                            <tr key={se.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-600">{se.id.toUpperCase()}</td>
                              <td className="p-3 text-slate-500">{se.time}</td>
                              <td className="p-3 font-bold">
                                {se.name} <span className="font-mono text-slate-400 font-semibold">({se.sku})</span>
                              </td>
                              <td className="p-3 text-right font-bold text-indigo-600">{se.qty}</td>
                              <td className="p-3 text-right">{formatCurrency(se.importPrice)}</td>
                              <td className="p-3 text-right font-bold text-kv-blue-primary">
                                {formatCurrency(se.total)}
                              </td>
                              <td className="p-3 text-slate-500 max-w-[200px] truncate" title={se.notes}>
                                {se.notes}
                              </td>
                            </tr>
                          ))}
                          {filteredStockEntries.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-10 text-center text-slate-400 font-semibold">
                                Không tìm thấy phiếu nhập kho phù hợp.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {canCreateGoodsReceipt && (
                    <GoodsReceiptModal
                      isOpen={isGoodsReceiptModalOpen}
                      onClose={() => setIsGoodsReceiptModalOpen(false)}
                      onSave={handleAddStock}
                      products={dbProducts}
                    />
                  )}
                </>
              )}

            </div>
          )}

          {/* PANE 3: CA BÁN HÀNG */}
          {activeTab === "shifts" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Shifts List */}
              <div className="xl:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
                  Lịch sử các ca bán hàng (shifts)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">Nhân viên ca</th>
                        <th className="p-3">Giờ mở ca</th>
                        <th className="p-3">Giờ đóng ca</th>
                        <th className="p-3 text-right">Quỹ đầu ca</th>
                        <th className="p-3 text-right">Thu két dự kiến</th>
                        <th className="p-3 text-right">Đếm thực tế</th>
                        <th className="p-3 text-right">Chênh lệch</th>
                        <th className="p-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {/* Show current running shift if open */}
                      {currentShift && (
                        <tr className="bg-blue-50/40 font-semibold border-l-2 border-l-blue-500">
                          <td className="p-3 font-bold text-slate-800">{currentShift.user}</td>
                          <td className="p-3 text-slate-500">{currentShift.openTime}</td>
                          <td className="p-3 text-slate-400">Đang hoạt động...</td>
                          <td className="p-3 text-right">{formatCurrency(currentShift.openingCash)}</td>
                          <td className="p-3 text-right">
                            {formatCurrency(currentShift.openingCash + totalRevenueToday)}
                          </td>
                          <td className="p-3 text-right text-slate-400">--</td>
                          <td className="p-3 text-right text-slate-400">--</td>
                          <td className="p-3 text-center">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              Đang mở
                            </span>
                          </td>
                        </tr>
                      )}

                      {shifts.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{s.user}</td>
                          <td className="p-3 text-slate-500">{s.openTime}</td>
                          <td className="p-3 text-slate-500">{s.closeTime}</td>
                          <td className="p-3 text-right">{formatCurrency(s.openingCash)}</td>
                          <td className="p-3 text-right">{formatCurrency(s.expectedCash)}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(s.actualCash)}</td>
                          <td
                            className={`p-3 text-right font-bold ${
                              s.difference === 0
                                ? "text-emerald-600"
                                : s.difference < 0
                                ? "text-rose-600"
                                : "text-amber-600"
                            }`}
                          >
                            {s.difference === 0 ? "0 đ" : (s.difference > 0 ? "+" : "") + formatCurrency(s.difference)}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                              Đã đóng
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Open/Close Actions */}
              <div className="xl:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[300px]">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-4">
                    Quản lý Ca Hiện Tại
                  </h3>

                  {currentShift === null ? (
                    /* CASE: Shift CLOSED */
                    <div className="flex flex-col gap-4 font-semibold text-slate-700">
                      <p className="text-slate-500 leading-relaxed font-medium">
                        Không có ca bán hàng nào đang mở. Vui lòng khai báo quỹ tiền mặt trong két ban đầu để bắt đầu bán hàng và ghi nhận doanh thu.
                      </p>
                      <div className="flex flex-col gap-1">
                        <label>Tiền mặt đầu ca (quỹ két tiền):</label>
                        <input
                          type="number"
                          value={openingCashInput}
                          onChange={(e) => setOpeningCashInput(Number(e.target.value))}
                          className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold"
                        />
                      </div>
                      <button
                        onClick={handleOpenShift}
                        className="bg-kv-green hover:bg-emerald-600 transition-colors text-white h-9 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        MỞ CA LÀM VIỆC MỚI
                      </button>
                    </div>
                  ) : (
                    /* CASE: Shift OPENED */
                    <div className="flex flex-col gap-3 font-semibold text-slate-700">
                      <div className="bg-kv-blue-light/50 border border-slate-200 p-3.5 rounded-lg flex flex-col gap-2 font-bold text-slate-700">
                        <div className="flex justify-between text-xs">
                          <span>Nhân viên ca:</span>
                          <span className="text-slate-900 font-extrabold">{currentShift.user}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Giờ mở ca:</span>
                          <span className="text-slate-900 font-extrabold">{currentShift.openTime}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Tiền quỹ ban đầu:</span>
                          <span className="text-slate-900 font-extrabold">
                            {formatCurrency(currentShift.openingCash)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs border-b pb-1.5 mb-1">
                          <span>Tổng đơn trong ca (hôm nay):</span>
                          <span className="text-slate-900 font-extrabold">{formatCurrency(totalRevenueToday)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-kv-blue-primary">
                          <span>Tiền mặt dự kiến có trong két:</span>
                          <span className="text-lg font-extrabold">
                            {formatCurrency(currentShift.openingCash + totalRevenueToday)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label>Tiền mặt đếm thực tế cuối ca:</label>
                        <input
                          type="number"
                          value={closingActualInput}
                          onChange={(e) => setClosingActualInput(Number(e.target.value))}
                          className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold"
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold py-1">
                        <span>Chênh lệch (Thiếu/Thừa):</span>
                        <span
                          className={`text-sm ${
                            closingActualInput - (currentShift.openingCash + totalRevenueToday) === 0
                              ? "text-emerald-600"
                              : closingActualInput - (currentShift.openingCash + totalRevenueToday) < 0
                              ? "text-rose-600"
                              : "text-amber-600"
                          }`}
                        >
                          {closingActualInput - (currentShift.openingCash + totalRevenueToday) === 0
                            ? "0 đ"
                            : (closingActualInput - (currentShift.openingCash + totalRevenueToday) > 0 ? "+" : "") +
                              formatCurrency(closingActualInput - (currentShift.openingCash + totalRevenueToday))}
                        </span>
                      </div>

                      {/* Display reason if difference exists */}
                      {closingActualInput - (currentShift.openingCash + totalRevenueToday) !== 0 && (
                        <div className="flex flex-col gap-1">
                          <label className="text-rose-600 flex items-center gap-1">
                            <span className="text-xs">⚠️</span>
                            Phát hiện chênh lệch! Vui lòng nhập lý do:
                          </label>
                          <textarea
                            value={closingReason}
                            onChange={(e) => setClosingReason(e.target.value)}
                            required
                            placeholder="Ví dụ: Thối thiếu cho khách hàng, thất lạc tiền lẻ..."
                            style={{ resize: "none" }}
                            className="border border-rose-300 h-14 p-2 rounded-lg focus:outline-none focus:border-rose-500 text-xs"
                          ></textarea>
                        </div>
                      )}

                      <button
                        onClick={handleCloseShift}
                        className="bg-rose-600 hover:bg-rose-700 transition-colors text-white h-9 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm mt-2"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        ĐỐI SOÁT &amp; ĐÓNG CA
                      </button>
                    </div>
                  )}
                </div>

                {/* Info status check */}
                <div className="text-[11px] bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg text-slate-500 text-center font-medium mt-4">
                  Sổ ca làm việc đồng bộ thời gian thực đến Chủ hộ và Kế toán.
                </div>
              </div>

            </div>
          )}

          {/* PANE 4: ĐƠN HÀNG */}
          {activeTab === "invoices" && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b pb-4 mb-2 flex-wrap gap-3">
                <span className="font-extrabold text-sm text-slate-800">
                  Lịch sử Hóa đơn Điện tử phát hành ({invoices.length} hóa đơn)
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">Lọc theo trạng thái:</span>
                  <select
                    value={invoiceFilterStatus}
                    onChange={(e) => setInvoiceFilterStatus(e.target.value)}
                    className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs bg-white font-bold text-slate-700"
                  >
                    <option value="ALL">Tất cả hóa đơn</option>
                    <option value="DRAFT">Khởi tạo (DRAFT)</option>
                    <option value="WAITING_TAX_CODE">Chờ cấp mã (WAITING)</option>
                    <option value="ISSUED">Đã cấp mã (ISSUED)</option>
                    <option value="CANCELED">Đã hủy (CANCELED)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">Mã hóa đơn</th>
                      <th className="p-3">Mẫu số & Ký hiệu</th>
                      <th className="p-3">Thời gian tạo</th>
                      <th className="p-3">Khách hàng</th>
                      <th className="p-3 text-right">Cộng tiền hàng</th>
                      <th className="p-3 text-right">Tiền thuế GTGT</th>
                      <th className="p-3 text-right">Tổng thanh toán</th>
                      <th className="p-3 text-center">Trạng thái thuế</th>
                      <th className="p-3">Mã cơ quan thuế</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {invoices
                      .filter((inv) => invoiceFilterStatus === "ALL" || inv.status === invoiceFilterStatus)
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-800">{inv.lookupCode}</td>
                          <td className="p-3 font-bold text-slate-500">
                            {inv.symbol} <span className="font-normal text-slate-400">/ 0000001</span>
                          </td>
                          <td className="p-3 text-slate-500">{inv.time}</td>
                          <td className="p-3 font-bold text-slate-700">{inv.customer}</td>
                          <td className="p-3 text-right">{formatCurrency(inv.amount)}</td>
                          <td className="p-3 text-right text-slate-500">{formatCurrency(inv.taxAmount)}</td>
                          <td className="p-3 text-right font-bold text-kv-blue-primary">
                            {formatCurrency(inv.finalAmount)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === "ISSUED"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : inv.status === "WAITING_TAX_CODE"
                                  ? "bg-amber-100 text-amber-700"
                                  : inv.status === "DRAFT"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {inv.status === "ISSUED"
                                ? "Đã cấp mã"
                                : inv.status === "WAITING_TAX_CODE"
                                ? "Chờ cấp mã"
                                : inv.status === "DRAFT"
                                ? "Khởi tạo"
                                : "Lỗi thuế"}
                            </span>
                          </td>
                           <td className="p-3 font-mono text-slate-500 font-bold text-xs">{inv.taxAuthorityCode}</td>
                           <td className="p-3 text-center">
                             {currentRole === "VT-02" ? (
                               <span className="bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1 select-none">
                                 🔒 Hạn chế
                               </span>
                             ) : (
                               <div className="flex items-center justify-center gap-2">
                                 {inv.status !== "CANCELED" && inv.status !== "ADJUSTED" && (
                                   <>
                                     <button
                                       onClick={() => handleAdjustInvoice(inv.id)}
                                       className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                                       title="Lập hóa đơn điều chỉnh (QTN-12)"
                                     >
                                       Điều chỉnh
                                     </button>
                                     <button
                                       onClick={() => handleCancelInvoice(inv.id)}
                                       className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                                       title="Hủy hóa đơn (QTN-05)"
                                     >
                                       Hủy bỏ
                                     </button>
                                   </>
                                 )}
                                 {inv.status === "CANCELED" && (
                                   <span className="text-rose-500 text-[10px] font-bold">Đã hủy bỏ</span>
                                 )}
                                 {inv.status === "ADJUSTED" && (
                                   <span className="text-slate-400 text-[10px] font-semibold italic">Đã điều chỉnh</span>
                                 )}
                               </div>
                             )}
                           </td>
                         </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PANE 5: KHÁCH HÀNG */}
          {activeTab === "customers" && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              
              {/* Left Column: Customer List */}
              <div className="xl:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
                  Khách hàng thân thiết &amp; Công nợ chi tiết
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3">Số điện thoại</th>
                        <th className="p-3">Địa chỉ thư điện tử</th>
                        <th className="p-3 text-right">Hạn mức ghi nợ</th>
                        <th className="p-3 text-right">Dư nợ hiện tại</th>
                        <th className="p-3 text-right">Dư nợ khả dụng</th>
                        <th className="p-3 text-center">Trạng thái công nợ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{c.name}</td>
                          <td className="p-3 font-mono font-semibold">{c.phone}</td>
                          <td className="p-3 text-slate-500">{c.email || "--"}</td>
                          <td className="p-3 text-right">{formatCurrency(c.creditLimit)}</td>
                          <td className="p-3 text-right font-bold text-rose-600">{formatCurrency(c.debt)}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">
                            {formatCurrency(c.creditLimit - c.debt)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.debt > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {c.debt > 0 ? "Đang ghi nợ" : "Không có nợ"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Customer Add form */}
              <div className="xl:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-4">
                  Thêm khách hàng mới
                </h3>
                <form onSubmit={handleAddCustomer} className="flex flex-col gap-4 font-semibold text-slate-700">
                  <div className="flex flex-col gap-1">
                    <label>Tên khách hàng:</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Họ và tên"
                      className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label>Số điện thoại:</label>
                    <input
                      type="text"
                      name="phone"
                      required
                      placeholder="Ví dụ: 0988888888"
                      className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label>Địa chỉ Email:</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="example@gmail.com"
                      className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label>Hạn mức nợ tối đa (đ):</label>
                    <input
                      type="number"
                      name="creditLimit"
                      required
                      defaultValue="5000000"
                      className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-kv-blue-primary text-white h-9 rounded-lg font-bold hover:bg-kv-blue-dark transition-all shadow-sm mt-2"
                  >
                    Lưu hồ sơ khách
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* PANE 5.5: NHÂN VIÊN */}
          {activeTab === "employees" && (
            <EmployeeList
              employees={employees}
              roles={roles}
              searchQuery={employeeSearchQuery}
              setSearchQuery={setEmployeeSearchQuery}
              statusFilter={employeeStatusFilter}
              selectedRole={employeeSelectedRole}
              userRole={currentRole}
            />
          )}

          {/* PANE 6: BÁO CÁO */}
          {activeTab === "reports" && (
            <div className="flex flex-col gap-6">
              
              {/* Reports - Revenue & Best sellers */}
              {reportSubTab === "revenue" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
                      Doanh thu bán hàng theo ca làm việc
                    </h3>
                    <div className="h-[250px] relative bg-slate-50/10 p-4 border border-dashed rounded-lg flex items-center justify-center">
                      {/* Interactive reports SVG */}
                      <svg className="w-full h-full" viewBox="0 0 500 200">
                        {/* Lines */}
                        <line x1="30" y1="20" x2="480" y2="20" stroke="#f1f5f9" />
                        <line x1="30" y1="70" x2="480" y2="70" stroke="#f1f5f9" />
                        <line x1="30" y1="120" x2="480" y2="120" stroke="#f1f5f9" />
                        <line x1="30" y1="170" x2="480" y2="170" stroke="#cbd5e1" />

                        {/* Labels Y */}
                        <text x="5" y="24" fill="#94a3b8" fontSize="8" fontWeight="bold">5.0M</text>
                        <text x="5" y="74" fill="#94a3b8" fontSize="8" fontWeight="bold">2.5M</text>
                        <text x="5" y="124" fill="#94a3b8" fontSize="8" fontWeight="bold">1.0M</text>
                        <text x="5" y="174" fill="#94a3b8" fontSize="8" fontWeight="bold">0.0 đ</text>

                        {/* Shift 1 bar */}
                        <rect x="80" y="80" width="40" height="90" rx="3" fill="#cbd5e1" />
                        <text x="100" y="72" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">
                          3.500k
                        </text>
                        <text x="100" y="186" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">
                          Ca s1
                        </text>

                        {/* Shift 2 bar */}
                        <rect x="180" y="118" width="40" height="52" rx="3" fill="#cbd5e1" />
                        <text x="200" y="110" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">
                          2.430k
                        </text>
                        <text x="200" y="186" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">
                          Ca s2
                        </text>

                        {/* Today's shift (if active) */}
                        <rect x="280" y={170 - (totalRevenueToday / 15000000) * 150} width="40" height={(totalRevenueToday / 15000000) * 150} rx="3" fill="#0068FF" />
                        <text x="300" y={162 - (totalRevenueToday / 15000000) * 150} fill="#0068FF" fontSize="8" fontWeight="bold" textAnchor="middle">
                          {totalRevenueToday > 0 ? (totalRevenueToday / 1000).toFixed(0) + "k" : "0đ"}
                        </text>
                        <text x="300" y="186" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">
                          Hôm nay
                        </text>
                      </svg>
                    </div>
                  </div>

                  <div className="xl:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
                      Hàng hóa bán chạy nhất
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold text-slate-700">
                        <thead>
                          <tr className="border-b text-slate-400">
                            <th className="pb-2">Tên hàng</th>
                            <th className="pb-2 text-right">Số lượng</th>
                            <th className="pb-2 text-right">Doanh thu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {totalRevenueToday > 0 ? (
                            <>
                              <tr>
                                <td className="py-2.5 font-bold text-slate-800">Coca-Cola 320ml</td>
                                <td className="py-2.5 text-right font-bold text-indigo-600">8 lon</td>
                                <td className="py-2.5 text-right font-bold">{formatCurrency(80000)}</td>
                              </tr>
                              <tr>
                                <td className="py-2.5 font-bold text-slate-800">Mì ăn liền Hảo Hảo</td>
                                <td className="py-2.5 text-right font-bold text-indigo-600">10 gói</td>
                                <td className="py-2.5 text-right font-bold">{formatCurrency(45000)}</td>
                              </tr>
                            </>
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">
                                Chưa có dữ liệu thống kê bán chạy hôm nay
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Reports - Comparison */}
              {reportSubTab === "comparison" && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
                    Đối chiếu &amp; So sánh doanh thu hai kỳ liên tiếp
                  </h3>
                  <p className="text-slate-500 font-medium mb-5">
                    Chọn hai khoảng thời gian không chồng lấn để kiểm tra biểu đồ tăng trưởng và đối soát mức độ chênh lệch phần trăm.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
                      <span className="font-bold text-kv-blue-primary block mb-3 text-xs uppercase tracking-wide">
                        Kỳ đối chiếu 1 (Kỳ gốc):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-slate-600">Từ ngày:</label>
                          <input
                            type="date"
                            defaultValue="2026-07-01"
                            className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-slate-600">Đến ngày:</label>
                          <input
                            type="date"
                            defaultValue="2026-07-07"
                            className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
                      <span className="font-bold text-kv-orange block mb-3 text-xs uppercase tracking-wide">
                        Kỳ đối chiếu 2 (Kỳ so sánh):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-slate-600">Từ ngày:</label>
                          <input
                            type="date"
                            defaultValue="2026-07-08"
                            className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-slate-600">Đến ngày:</label>
                          <input
                            type="date"
                            defaultValue="2026-07-14"
                            className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t pt-4">
                    <button className="bg-slate-200 hover:bg-slate-300 transition-colors font-bold px-4 h-9 rounded-lg">
                      Làm sạch thiết lập
                    </button>
                    <button className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-4 h-9 rounded-lg transition-colors">
                      Bắt đầu phân tích đối soát
                    </button>
                  </div>
                </div>
              )}

              {/* Reports - Logs */}
              {reportSubTab === "logs" && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-2">
                    Nhật ký hoạt động hệ thống
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-3">Thời gian ghi nhận</th>
                          <th className="p-3">Tài khoản thực hiện</th>
                          <th className="p-3">Mã hành động</th>
                          <th className="p-3">Mục tiêu tác động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-500 font-mono">{log.time}</td>
                            <td className="p-3 font-bold text-slate-800">{log.user}</td>
                            <td className="p-3">
                              <span className="bg-blue-50 text-blue-700 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-600">{log.target}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* PANE 7: CẤU HÌNH */}
          {activeTab === "config" && (
            <div className="grid grid-cols-1 gap-6">
              
              {/* Config - shop info */}
              {configSubTab === "info" && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
                    Hồ sơ Thông tin Hộ kinh doanh
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400 font-medium text-xs">Tên Hộ kinh doanh cá thể:</span>
                        <span className="text-sm font-bold text-slate-900 border-b pb-1.5 mt-1">
                          {household?.name || "Chủ hộ Tạp Hóa Việt"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400 font-medium text-xs">Mã số thuế đăng ký:</span>
                        <span className="text-sm font-bold text-slate-900 font-mono tracking-wider border-b pb-1.5 mt-1">
                          {household?.taxCode || "8934567890"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400 font-medium text-xs">Số điện thoại liên lạc:</span>
                        <span className="text-sm font-bold text-slate-900 border-b pb-1.5 mt-1">
                          {household?.phoneNumber || "0988888888"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400 font-medium text-xs">Địa chỉ cửa hàng vật lý:</span>
                        <span className="text-sm font-bold text-slate-900 border-b pb-1.5 mt-1">
                          {household?.address || "Hà Nội, Việt Nam"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-xs">
                    <span className="text-base">ℹ️</span>
                    <span className="font-semibold leading-relaxed">
                      Thông tin hồ sơ hộ kinh doanh được đồng bộ tự động từ tờ khai hóa đơn thuế điện tử và không được phép chỉnh sửa tự do sau khi cơ quan thuế đã cấp mã số kinh doanh.
                    </span>
                  </div>
                </div>
              )}

              {/* Config - tax list */}
              {configSubTab === "tax" && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-2">
                    Cấu hình Thuế suất doanh thu Hộ kinh doanh
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-3">Mã ngành/Thuế</th>
                          <th className="p-3">Mô tả nhóm hàng hóa</th>
                          <th className="p-3 text-right">Tỷ lệ tính thuế GTGT</th>
                          <th className="p-3 text-right">Tỷ lệ thuế TNCN</th>
                          <th className="p-3 text-center">Trạng thái áp dụng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr>
                          <td className="p-3 font-mono font-bold text-slate-600">VAT-08</td>
                          <td className="p-3 font-bold text-slate-800">Ngành bán buôn, bán lẻ hàng hóa thông thường</td>
                          <td className="p-3 text-right font-bold text-kv-blue-primary">1.0%</td>
                          <td className="p-3 text-right font-bold text-indigo-600">0.5%</td>
                          <td className="p-3 text-center">
                            <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                              Mặc định
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-slate-600">VAT-05</td>
                          <td className="p-3 font-bold text-slate-800">Ngành dịch vụ, ăn uống, thi công xây dựng</td>
                          <td className="p-3 text-right font-bold text-kv-blue-primary">2.0%</td>
                          <td className="p-3 text-right font-bold text-indigo-600">1.0%</td>
                          <td className="p-3 text-center">
                            <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px]">
                              Hoạt động
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Config - Printer */}
              {configSubTab === "printer" && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
                    Thiết lập Máy in Hóa đơn bán lẻ
                  </h3>
                  <form onSubmit={(e) => { e.preventDefault(); alert("Đã lưu thiết lập máy in hóa đơn."); }} className="flex flex-col gap-4 font-semibold text-slate-700 max-w-md">
                    <div className="flex flex-col gap-1">
                      <label>Chọn thiết bị máy in kết nối:</label>
                      <select className="border border-slate-300 h-9 px-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs bg-white font-bold">
                        <option>Máy in nhiệt K80 (Kết nối USB/LAN)</option>
                        <option>Máy in khổ giấy A5 (Kết nối văn phòng)</option>
                        <option>Máy in hóa đơn bluetooth mini</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label>Khổ giấy (Khổ in):</label>
                        <select className="border border-slate-300 h-9 px-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs bg-white font-bold">
                          <option>K80 (80mm)</option>
                          <option>K58 (58mm)</option>
                          <option>Khổ A5 dọc</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label>Số liên bản in:</label>
                        <input
                          type="number"
                          defaultValue="1"
                          min="1"
                          className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        id="auto-print"
                        defaultChecked
                        className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
                      />
                      <label htmlFor="auto-print" className="cursor-pointer font-bold">
                        Tự động in hóa đơn ngay sau khi thanh toán đơn hàng (Chốt ca)
                      </label>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button type="submit" className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-4 h-9 rounded-lg transition-colors">
                        Lưu cấu hình
                      </button>
                      <button type="button" onClick={() => alert("Đang gửi yêu cầu in thử hóa đơn K80...")} className="bg-slate-200 hover:bg-slate-300 font-bold px-4 h-9 rounded-lg transition-colors">
                        In thử hóa đơn K80
                      </button>
                    </div>
                  </form>
                </div>
              )}



            </div>
          )}
          </>
          )}
        </main>

      </div>

    </div>
  );
};

export default DashboardPage;
