import React from "react";
import {
  X,
  Clock,
  User,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IShiftRevenueItem } from "../types/IShiftRevenueReport";

interface ShiftDetailDrawerProps {
  shift: IShiftRevenueItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftDetailDrawer: React.FC<ShiftDetailDrawerProps> = ({
  shift,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !shift) return null;

  const hasDiff = shift.differenceAmount !== 0;
  const isPositive = shift.differenceAmount > 0;
  const isOver = shift.isOverThreshold;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-kv-blue-primary block">
                Chi tiết ca bán hàng
              </span>
              <h2 className="text-base font-black text-slate-900 font-mono">
                {shift.shiftCode}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5 flex-1 text-xs">
            {/* 1. Thông tin tổng quan ca */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Nhân viên trực ca:
                </span>
                <span className="font-bold text-slate-800">
                  {shift.fullName} ({shift.username})
                </span>
              </div>

              {shift.posName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Điểm bán:
                  </span>
                  <span className="font-bold text-slate-800">{shift.posName}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Thời gian trực:
                </span>
                <span className="font-bold text-slate-800">
                  {shift.openedAt.substring(11, 16)} → {shift.closedAt.substring(11, 16)} (
                  {Math.floor(shift.durationMinutes / 60)}h{shift.durationMinutes % 60}m)
                </span>
              </div>
            </div>

            {/* 2. Biên bản đối soát tiền két */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-2xs">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center justify-between border-b pb-2">
                <span>Biên Bản Đối Soát Tiền Két</span>
                {!hasDiff ? (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Khớp tiền
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isOver ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {isOver ? "Lệch vượt ngưỡng" : "Lệch tiền"}
                  </span>
                )}
              </h3>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Tiền ban đầu (Đầu ca):</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(shift.openingCash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>+ Doanh thu tiền mặt trong ca:</span>
                  <span className="font-medium text-emerald-600">
                    +{formatCurrency(shift.cashRevenue)}
                  </span>
                </div>
                {shift.cashIn > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span className="flex items-center gap-1">
                      <ArrowDownLeft className="w-3 h-3" /> Thu khác trong ca:
                    </span>
                    <span className="font-medium">+{formatCurrency(shift.cashIn)}</span>
                  </div>
                )}
                {shift.cashOut > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> Chi khác trong ca:
                    </span>
                    <span className="font-medium">-{formatCurrency(shift.cashOut)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed pt-2 font-bold text-slate-800">
                  <span>= Tiền két lý thuyết (Expected):</span>
                  <span>{formatCurrency(shift.closingCashExpected)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 bg-slate-50 p-2 rounded-lg">
                  <span>Tiền thực đếm khi đóng ca:</span>
                  <span className="text-sm text-kv-blue-primary">
                    {formatCurrency(shift.closingCashActual)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-black">
                  <span>Mức chênh lệch két (Actual - Expected):</span>
                  <span
                    className={`${
                      !hasDiff
                        ? "text-emerald-600"
                        : isOver
                        ? "text-rose-600 text-sm"
                        : isPositive
                        ? "text-amber-600"
                        : "text-rose-500"
                    }`}
                  >
                    {!hasDiff
                      ? "0 đ (Khớp tuyệt đối)"
                      : `${isPositive ? "+" : ""}${formatCurrency(shift.differenceAmount)}`}
                  </span>
                </div>

                {/* Lý do giải trình khi đóng ca (TC-02) */}
                {shift.differenceReason && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    <div className="font-bold flex items-center gap-1 mb-0.5">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Lý do nhân viên giải trình khi đóng ca:
                    </div>
                    <p className="italic">"{shift.differenceReason}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Cơ cấu doanh thu */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-2xs">
              <h3 className="font-extrabold text-slate-800 text-xs border-b pb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-kv-blue-primary" />
                Cơ Cấu Doanh Thu Ca ({formatCurrency(shift.totalRevenue)})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Tiền mặt</span>
                  <span className="font-black text-slate-800 text-xs block mt-0.5">
                    {formatCurrency(shift.cashRevenue)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {shift.totalRevenue > 0
                      ? Math.round((shift.cashRevenue / shift.totalRevenue) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                  <span className="text-[10px] text-kv-blue-primary font-bold block">
                    Chuyển khoản QR
                  </span>
                  <span className="font-black text-kv-blue-primary text-xs block mt-0.5">
                    {formatCurrency(shift.transferRevenue)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {shift.totalRevenue > 0
                      ? Math.round((shift.transferRevenue / shift.totalRevenue) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Danh sách đơn hàng trong ca */}
            {shift.orders && shift.orders.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white shadow-2xs">
                <h3 className="font-extrabold text-slate-800 text-xs flex items-center justify-between border-b pb-2">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    Đơn Hàng Trong Ca
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {shift.completedOrdersCount} hoàn thành / {shift.canceledOrdersCount} hủy
                  </span>
                </h3>

                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                  {shift.orders.map((ord) => (
                    <div key={ord.id} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 font-mono text-[11px]">
                          {ord.orderCode}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ord.customerName} • {ord.createdAt}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {formatCurrency(ord.totalAmount)}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                            ord.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {ord.paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
