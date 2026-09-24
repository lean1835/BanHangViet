import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Users,
  Store,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  useGetServicePackagesQuery,
  useCreateServicePackageMutation,
  useUpdateServicePackageMutation,
  useDeleteServicePackageMutation,
} from "../services/platformAdminApi";
import type {
  IServicePackageItem,
  ICreatePackagePayload,
  IUpdatePackagePayload,
} from "../types/platformAdminTypes";
import { PackageFormModal } from "../components/PackageFormModal";
import { DeletePackageModal } from "../components/DeletePackageModal";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { useNotification } from "@/hooks/useNotification";

export const PackageManagementPage: React.FC = () => {
  const { showSuccess, showError } = useNotification();

  const {
    data: packages = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetServicePackagesQuery();

  const [createPackage, { isLoading: isCreating }] =
    useCreateServicePackageMutation();
  const [updatePackage, { isLoading: isUpdating }] =
    useUpdateServicePackageMutation();
  const [deletePackage, { isLoading: isDeleting }] =
    useDeleteServicePackageMutation();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedPackageForEdit, setSelectedPackageForEdit] =
    useState<IServicePackageItem | null>(null);
  const [selectedPackageForDelete, setSelectedPackageForDelete] =
    useState<IServicePackageItem | null>(null);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchSearch =
        !searchQuery.trim() ||
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && pkg.isActive) ||
        (statusFilter === "INACTIVE" && !pkg.isActive);

      return matchSearch && matchStatus;
    });
  }, [packages, searchQuery, statusFilter]);

  // Metric stats
  const stats = useMemo(() => {
    const total = packages.length;
    const active = packages.filter((p) => p.isActive).length;
    const inactive = total - active;
    const avgPrice =
      total > 0
        ? Math.round(packages.reduce((sum, p) => sum + p.price, 0) / total)
        : 0;
    return { total, active, inactive, avgPrice };
  }, [packages]);

  // Actions
  const handleOpenCreateModal = () => {
    setSelectedPackageForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (pkg: IServicePackageItem) => {
    setSelectedPackageForEdit(pkg);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (
    data: ICreatePackagePayload | IUpdatePackagePayload
  ) => {
    if ("id" in data) {
      await updatePackage(data).unwrap();
      showSuccess(`Cập nhật gói "${data.name}" thành công!`);
    } else {
      await createPackage(data).unwrap();
      showSuccess(`Tạo gói dịch vụ mới "${data.name}" thành công!`);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deletePackage(id).unwrap();
      showSuccess("Đã xóa hoặc chuyển gói sang trạng thái ngưng hoạt động thành công!");
    } catch (err: any) {
      showError(err?.data?.message || "Không thể xóa gói dịch vụ");
      throw err;
    }
  };

  const handleToggleStatus = async (pkg: IServicePackageItem) => {
    try {
      const newStatus = !pkg.isActive;
      await updatePackage({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        maxUsers: pkg.maxUsers,
        maxPosPoints: pkg.maxPosPoints,
        maxInvoicesPerMonth: pkg.maxInvoicesPerMonth,
        dataRetentionDays: pkg.dataRetentionDays,
        isActive: newStatus,
      }).unwrap();
      showSuccess(
        `Đã ${newStatus ? "kích hoạt lại" : "tạm ngưng"} gói dịch vụ ${pkg.name}`
      );
    } catch (err: any) {
      showError(err?.data?.message || "Không thể thay đổi trạng thái gói dịch vụ");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-blue-50 text-kv-blue-primary">
              <Package size={22} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Cấu hình gói dịch vụ nền tảng
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Quản lý các gói đăng ký thuê bao, phân bổ định mức người dùng, điểm bán POS và hóa đơn điện tử.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={17} className={isFetching ? "animate-spin text-kv-blue-primary" : ""} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Thêm gói dịch vụ mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Packages */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng số gói
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.total} <span className="text-xs font-semibold text-slate-400">gói</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Trên toàn hệ thống</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-kv-blue-primary">
            <Package size={24} />
          </div>
        </div>

        {/* Active Packages */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Đang hoạt động
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {stats.active} <span className="text-xs font-semibold text-emerald-500">gói</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Sẵn sàng gán cho hộ</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Inactive Packages */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tạm ngưng
            </span>
            <div className="text-2xl font-black text-slate-700 mt-1">
              {stats.inactive} <span className="text-xs font-semibold text-slate-400">gói</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Ngưng nhận đăng ký mới</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-500">
            <XCircle size={24} />
          </div>
        </div>

        {/* Avg Price */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              Giá trung bình
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(stats.avgPrice)}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Đơn giá thuê bao/tháng</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Tìm theo tên gói, mã gói..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 outline-hidden text-xs font-medium text-slate-900 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              Tất cả ({packages.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              Hoạt động ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "INACTIVE"
                  ? "bg-white text-slate-700 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              Tạm ngưng ({stats.inactive})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-white">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "GRID"
                  ? "bg-blue-50 text-kv-blue-primary font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid size={17} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "TABLE"
                  ? "bg-blue-50 text-kv-blue-primary font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Xem dạng bảng"
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="h-8 w-8 rounded-full border-3 border-kv-blue-primary border-t-transparent animate-spin mb-3" />
          <span className="text-xs font-semibold text-slate-500">Đang tải danh sách gói dịch vụ...</span>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 text-center p-6">
          <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Package size={32} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">
            Không tìm thấy gói dịch vụ phù hợp
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            {searchQuery
              ? `Không có gói nào khớp với từ khóa "${searchQuery}". Hãy thử tìm với từ khóa khác.`
              : "Hiện chưa có gói dịch vụ nào trong hệ thống."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kv-blue-primary text-white text-xs font-bold shadow-sm hover:bg-kv-blue-dark transition-all"
          >
            <Plus size={15} />
            <span>Thêm gói mới ngay</span>
          </button>
        </div>
      ) : viewMode === "GRID" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredPackages.map((pkg) => {
            const isStandard = pkg.code.includes("STANDARD");
            const isPremium = pkg.code.includes("PREMIUM") || pkg.code.includes("PRO");
            const isStarter = pkg.code.includes("BASIC") || pkg.code.includes("STARTER");

            const accentColor = isPremium
              ? "from-purple-500 to-indigo-600 text-purple-600 bg-purple-50 border-purple-200"
              : isStarter
              ? "from-emerald-500 to-teal-600 text-emerald-600 bg-emerald-50 border-emerald-200"
              : "from-blue-500 to-cyan-600 text-kv-blue-primary bg-blue-50 border-blue-200";

            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden relative ${
                  pkg.isActive
                    ? "border-slate-200/90 hover:border-blue-300"
                    : "border-slate-200 opacity-75 bg-slate-50/40"
                }`}
              >
                {/* Top Accent Bar */}
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${
                    pkg.isActive ? accentColor.split(" ")[0] + " " + accentColor.split(" ")[1] : "from-slate-300 to-slate-400"
                  }`}
                />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {pkg.name}
                        </h3>
                        {isStandard && pkg.isActive && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider">
                            <Sparkles size={10} /> Tiêu chuẩn
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Mã: {pkg.code}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        pkg.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {pkg.isActive ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Hoạt động
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Tạm ngưng
                        </>
                      )}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="my-3 pb-3 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {formatCurrency(pkg.price)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        / tháng
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 min-h-[34px] mb-4">
                    {pkg.description || "Gói dịch vụ chính thức dành cho hộ kinh doanh trên nền tảng Bán Hàng Việt."}
                  </p>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-blue-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Tài khoản</span>
                        <span className="font-bold text-slate-800">{pkg.maxUsers} users</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Store size={14} className="text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Điểm bán POS</span>
                        <span className="font-bold text-slate-800">{pkg.maxPosPoints} điểm</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-purple-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Hạn mức HĐ</span>
                        <span className="font-bold text-slate-800">
                          {formatNumber(pkg.maxInvoicesPerMonth)} /tháng
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Lưu trữ</span>
                        <span className="font-bold text-slate-800">
                          {pkg.dataRetentionDays} ngày (~{Math.round(pkg.dataRetentionDays / 30)}th)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(pkg)}
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      pkg.isActive
                        ? "text-slate-600 hover:text-amber-700 hover:bg-amber-50 border-slate-200 hover:border-amber-200"
                        : "text-emerald-700 hover:bg-emerald-50 border-slate-200 hover:border-emerald-200"
                    }`}
                  >
                    {pkg.isActive ? "Tạm ngưng" : "Kích hoạt"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(pkg)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-kv-blue-primary hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
                      title="Chỉnh sửa cấu hình"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPackageForDelete(pkg)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Xóa gói"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Mã gói</th>
                  <th className="px-5 py-3.5">Tên gói dịch vụ</th>
                  <th className="px-5 py-3.5">Đơn giá / tháng</th>
                  <th className="px-4 py-3.5 text-center">Tài khoản</th>
                  <th className="px-4 py-3.5 text-center">Điểm POS</th>
                  <th className="px-4 py-3.5 text-center">Hóa đơn/tháng</th>
                  <th className="px-4 py-3.5 text-center">Lưu trữ</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">
                      {pkg.code}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-900">{pkg.name}</div>
                      {pkg.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {pkg.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-extrabold text-kv-blue-primary">
                      {formatCurrency(pkg.price)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {pkg.maxUsers}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {pkg.maxPosPoints}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {formatNumber(pkg.maxInvoicesPerMonth)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {pkg.dataRetentionDays} ngày
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pkg.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {pkg.isActive ? "Hoạt động" : "Tạm ngưng"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(pkg)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                            pkg.isActive
                              ? "text-slate-600 hover:text-amber-700 hover:bg-amber-50 border-slate-200"
                              : "text-emerald-700 hover:bg-emerald-50 border-slate-200"
                          }`}
                        >
                          {pkg.isActive ? "Ngưng" : "Bật"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(pkg)}
                          className="p-1 text-slate-500 hover:text-kv-blue-primary hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPackageForDelete(pkg)}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GAP 48 / Technical policy alert footer */}
      <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-slate-700">
        <ShieldCheck size={18} className="text-kv-blue-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 font-bold">Chính sách hạn mức & quản trị gói:</strong>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            - Hạn mức người dùng (`maxUsers`) và hạn mức điểm bán POS (`maxPosPoints`) sẽ trực tiếp kiểm soát số lượng tài khoản và quầy thu ngân mà Chủ hộ được phép khởi tạo.
            <br />
            - Khi hộ kinh doanh đạt tối đa số hóa đơn trong tháng (`maxInvoicesPerMonth`), hệ thống vẫn bảo đảm việc ký số phát hành hóa đơn điện tử không bị gián đoạn và ghi nhận phụ phí phụ trội vào chu kỳ đối soát tiếp theo.
            <br />
            - Không thể xóa vĩnh viễn các gói dịch vụ đang có thuê bao hộ kinh doanh liên kết; thao tác xóa sẽ tự động chuyển gói sang trạng thái <strong>Tạm ngưng</strong>.
          </p>
        </div>
      </div>

      {/* Modals */}
      <PackageFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={selectedPackageForEdit}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
      />

      <DeletePackageModal
        isOpen={Boolean(selectedPackageForDelete)}
        onClose={() => setSelectedPackageForDelete(null)}
        pkg={selectedPackageForDelete}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PackageManagementPage;
