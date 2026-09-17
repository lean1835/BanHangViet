import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  UtensilsCrossed,
  Clock,
  Users,
  Wallet,
  Ban,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface IPosMoreActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTableManagement?: () => void;
  onOpenHeldOrders?: () => void;
  onOpenShiftHandover?: () => void;
  onOpenCashTransaction?: () => void;
  onCancelOrder?: () => void;
  onOpenCombinedPayment?: () => void;
  canManage?: boolean;
  heldOrdersCount?: number;
  pendingExpenseCount?: number;
  minTouchHeight?: string;
}

export const PosMoreActionsModal: React.FC<IPosMoreActionsModalProps> = ({
  isOpen,
  onClose,
  onOpenTableManagement,
  onOpenHeldOrders,
  onOpenShiftHandover,
  onOpenCashTransaction,
  onCancelOrder,
  onOpenCombinedPayment,
  canManage = false,
  heldOrdersCount = 0,
  pendingExpenseCount = 0,
  minTouchHeight = "52px",
}) => {
  if (!isOpen) return null;

  const handleActionClick = (fn?: () => void) => {
    if (fn) {
      onClose();
      fn();
    }
  };

  const actions = [
    {
      id: "HELD_ORDERS",
      label: "Xem danh sách đơn đang treo",
      shortcut: "Alt+H",
      desc: `Xem lại các đơn khách chưa thanh toán (${heldOrdersCount} đơn đang treo)`,
      icon: <Clock size={20} className="text-amber-600" />,
      onClick: onOpenHeldOrders,
      badge: heldOrdersCount > 0 ? `${heldOrdersCount}` : undefined,
      badgeColor: "bg-amber-100 text-amber-900",
      show: Boolean(onOpenHeldOrders),
    },
    {
      id: "TABLE_MANAGEMENT",
      label: "Quản lý phòng / bàn",
      shortcut: "Alt+T",
      desc: "Chọn bàn ăn, chuyển bàn hoặc ghép bàn cho khách",
      icon: <UtensilsCrossed size={20} className="text-indigo-600" />,
      onClick: onOpenTableManagement,
      show: Boolean(onOpenTableManagement && canManage),
    },
    {
      id: "COMBINED_PAYMENT",
      label: "Thanh toán kết hợp / Bán ghi nợ",
      shortcut: "Alt+C",
      desc: "Phân chia tiền mặt, chuyển khoản và ghi nợ theo hạn mức",
      icon: <SlidersHorizontal size={20} className="text-blue-600" />,
      onClick: onOpenCombinedPayment,
      show: Boolean(onOpenCombinedPayment),
    },
    {
      id: "CASH_TRANSACTION",
      label: "Ghi thu / chi tiền mặt trong ca",
      shortcut: "Alt+M",
      desc: "Ghi nhận các khoản nộp tiền hoặc chi phí ngoài bán hàng",
      icon: <Wallet size={20} className="text-emerald-600" />,
      onClick: onOpenCashTransaction,
      badge:
        pendingExpenseCount > 0 ? `${pendingExpenseCount} chờ duyệt` : undefined,
      badgeColor: "bg-rose-100 text-rose-800",
      show: Boolean(onOpenCashTransaction),
    },
    {
      id: "SHIFT_HANDOVER",
      label: "Bàn giao ca làm việc",
      shortcut: "Alt+S",
      desc: "Chốt tiền mặt két và bàn giao cho nhân viên tiếp theo",
      icon: <Users size={20} className="text-teal-600" />,
      onClick: onOpenShiftHandover,
      show: Boolean(onOpenShiftHandover),
    },
    {
      id: "CANCEL_ORDER",
      label: "Hủy đơn hàng đang tạo",
      shortcut: "Esc",
      desc: "Hủy bỏ toàn bộ các món trong đơn hàng đang chọn (có cảnh báo hậu quả)",
      icon: <Ban size={20} className="text-rose-600" />,
      onClick: onCancelOrder,
      isDestructive: true,
      show: Boolean(onCancelOrder),
    },
  ];

  const visibleActions = actions.filter((a) => a.show);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 animate-backdrop-fade-in backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-modal-bounce-in text-slate-800"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="more-actions-modal-title"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/80 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2
                id="more-actions-modal-title"
                className="text-sm sm:text-base font-extrabold uppercase tracking-wide"
              >
                Các chức năng xem thêm (NCL-19-CN-001)
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Chế độ rút gọn: Các chức năng phụ được thu vào mục này để màn bán
                hàng thông thoáng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action List */}
        <div className="p-4 sm:p-5 space-y-2.5 max-h-[70vh] overflow-y-auto bg-slate-50/50">
          {visibleActions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => handleActionClick(act.onClick)}
              style={{ minHeight: minTouchHeight }}
              className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs ${
                act.isDestructive
                  ? "bg-rose-50/70 hover:bg-rose-100/90 border-rose-200 text-rose-900"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    act.isDestructive ? "bg-rose-100" : "bg-slate-100"
                  }`}
                >
                  {act.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs sm:text-sm">
                      {act.label}
                    </span>
                    {act.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono text-slate-500 font-bold">
                        {act.shortcut}
                      </kbd>
                    )}
                    {act.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${act.badgeColor}`}
                      >
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {act.desc}
                  </p>
                </div>
              </div>

              <ChevronRight
                size={18}
                className={act.isDestructive ? "text-rose-400" : "text-slate-400"}
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng bảng thao tác
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PosMoreActionsModal;
