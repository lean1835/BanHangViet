import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Users, UserPlus, UserMinus, X, Loader2, Check, Search, AlertTriangle } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { IPointOfSale } from "../types/IPointOfSale";
import {
  useGetPosEmployeesQuery,
  useAssignPosEmployeesMutation,
  useUnassignPosEmployeeMutation,
} from "../services/pointOfSaleApi";
import { useGetAllEmployeesQuery } from "@/modules/employee/services/employeeApi";

interface AssignEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointOfSale?: IPointOfSale | null;
  onSuccessToast?: (message: string) => void;
  onErrorToast?: (message: string) => void;
}

export const AssignEmployeeModal: React.FC<AssignEmployeeModalProps> = ({
  isOpen,
  onClose,
  pointOfSale,
  onSuccessToast,
  onErrorToast,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [hasConfirmedShiftClosed, setHasConfirmedShiftClosed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserIds([]);
      setHasConfirmedShiftClosed(false);
      setSearchTerm("");
    }
  }, [isOpen]);

  const posId = pointOfSale?.id || "";
  const { data: assignedEmployees = [], isLoading: isLoadingAssigned } =
    useGetPosEmployeesQuery(posId, { skip: !posId || !isOpen });

  const { data: allEmployees = [], isLoading: isLoadingAll } =
    useGetAllEmployeesQuery(undefined, { skip: !isOpen });

  const [assignEmployees, { isLoading: isAssigning }] =
    useAssignPosEmployeesMutation();
  const [unassignEmployee, { isLoading: isUnassigning }] =
    useUnassignPosEmployeeMutation();

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isAssigning && !isUnassigning,
  });

  const assignedUserIds = useMemo(
    () => new Set(assignedEmployees.map((e) => e.id)),
    [assignedEmployees]
  );

  // Lọc danh sách nhân viên có thể gán (loại trừ VT-01 chủ hộ và người đã gán)
  const availableEmployees = useMemo(() => {
    return allEmployees.filter((emp) => {
      if (emp.roleCode === "VT-01") return false;
      if (assignedUserIds.has(emp.id)) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          emp.fullName.toLowerCase().includes(query) ||
          emp.username.toLowerCase().includes(query) ||
          emp.phoneNumber?.includes(query)
        );
      }
      return true;
    });
  }, [allEmployees, assignedUserIds, searchTerm]);

  if (!isOpen || !pointOfSale) return null;

  const handleToggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAssignSelected = async () => {
    if (selectedUserIds.length === 0 || isAssigning) return;
    if (!hasConfirmedShiftClosed) {
      onErrorToast?.("Vui lòng xác nhận nhân viên đã đóng ca bán hàng trước khi gán vào điểm bán mới");
      return;
    }
    try {
      await assignEmployees({
        posId: pointOfSale.id,
        body: { userIds: selectedUserIds },
      }).unwrap();
      setSelectedUserIds([]);
      setHasConfirmedShiftClosed(false);
      onSuccessToast?.(`Đã gán ${selectedUserIds.length} nhân viên vào điểm bán ${pointOfSale.name}`);
    } catch (err: any) {
      onErrorToast?.(err?.data?.message || "Không thể gán nhân viên vào điểm bán");
    }
  };

  const handleUnassign = async (userId: string, employeeName: string) => {
    if (isUnassigning) return;
    try {
      await unassignEmployee({
        posId: pointOfSale.id,
        userId,
      }).unwrap();
      onSuccessToast?.(`Đã gỡ nhân viên ${employeeName} khỏi điểm bán`);
    } catch (err: any) {
      onErrorToast?.(err?.data?.message || "Không thể gỡ nhân viên khỏi điểm bán");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-kv-blue-light text-kv-blue-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Gán nhân viên theo điểm bán
              </h2>
              <p className="text-xs text-slate-500">
                Điểm bán: <span className="font-semibold text-slate-700">{pointOfSale.name}</span> ({pointOfSale.posCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Cảnh báo đóng ca bán hàng */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-amber-950">
                Lưu ý quan trọng về ca bán hàng:
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Nhân viên / thu ngân <strong>bắt buộc phải kết ca và đóng ca bán hàng hiện tại</strong> trước khi được gán sang điểm bán mới. Nếu nhân viên đang mở ca tại điểm khác, việc đổi điểm bán có thể làm gián đoạn chốt sổ tiền mặt và báo cáo ca.
              </p>
            </div>
          </div>

          {/* Section 1: Danh sách nhân viên đang thuộc điểm này */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Nhân viên đang làm việc tại điểm này ({assignedEmployees.length})
              </h3>
            </div>

            {isLoadingAssigned ? (
              <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải danh sách...
              </div>
            ) : assignedEmployees.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                Chưa có nhân viên nào được gán vào điểm bán này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assignedEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-xs hover:border-slate-200 transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{emp.fullName}</p>
                      <p className="text-[11px] text-slate-400">@{emp.username} · {emp.roleName || emp.roleCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnassign(emp.id, emp.fullName)}
                      disabled={isUnassigning}
                      title="Gỡ khỏi điểm bán"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Gán thêm nhân viên */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Gán thêm nhân viên vào điểm bán
              </h3>
              {selectedUserIds.length > 0 && (
                <span className="text-xs font-bold text-kv-blue-primary">
                  Đã chọn {selectedUserIds.length} nhân viên
                </span>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhân viên theo tên, username, số điện thoại..."
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            {/* Available List */}
            {isLoadingAll ? (
              <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải nhân viên...
              </div>
            ) : availableEmployees.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
                {searchTerm
                  ? "Không tìm thấy nhân viên phù hợp."
                  : "Tất cả nhân viên đủ điều kiện đã được gán vào điểm bán này."}
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {availableEmployees.map((emp) => {
                  const isSelected = selectedUserIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleSelect(emp.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                        isSelected
                          ? "border-kv-blue-primary bg-kv-blue-light/40"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-kv-blue-primary border-kv-blue-primary text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{emp.fullName}</p>
                          <p className="text-[10px] text-slate-400">
                            @{emp.username} · {emp.phoneNumber || "Không có SĐT"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {emp.roleCode === "VT-02" ? "Thu ngân" : emp.roleCode === "VT-03" ? "Kế toán" : emp.roleCode}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Checkbox xác nhận đóng ca */}
            {selectedUserIds.length > 0 && (
              <div className="mt-3">
                <label className="flex items-start gap-2.5 p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 cursor-pointer select-none transition-all hover:bg-amber-50">
                  <input
                    type="checkbox"
                    checked={hasConfirmedShiftClosed}
                    onChange={(e) => setHasConfirmedShiftClosed(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 mt-0.5 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-amber-950">
                    Tôi xác nhận các nhân viên được chọn đã <strong>kết ca và đóng ca bán hàng</strong> (nếu có) trước khi gán sang điểm bán này.
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <span className="text-[11px] text-slate-400">
            * Thu ngân chỉ được thao tác mở ca và bán hàng tại đúng điểm bán được gán.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleAssignSelected}
              disabled={selectedUserIds.length === 0 || isAssigning || !hasConfirmedShiftClosed}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-xl shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Gán vào điểm bán ({selectedUserIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
