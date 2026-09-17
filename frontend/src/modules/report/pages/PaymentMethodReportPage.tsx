import React from "react";
import { ShieldAlert } from "lucide-react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { PaymentMethodReport } from "../components/PaymentMethodReport";

export const PaymentMethodReportPage: React.FC = () => {
  const { currentRole } = useDashboardDemo();

  // Role Guard: NCL-07-CN-011 blocks cashier/salesperson VT-02
  const isCashier = currentRole === USER_ROLES.CASHIER;

  if (isCashier) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 animate-fade-in my-12 bg-white rounded-2xl border border-rose-200 shadow-xs">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Không có quyền truy cập báo cáo
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tài khoản của bạn với vai trò <strong>Thu ngân (VT-02)</strong> không có quyền xem báo cáo cơ cấu thanh toán và số dư công nợ toàn hộ. Vui lòng liên hệ Chủ hộ (VT-01) hoặc Kế toán (VT-03).
        </p>
      </div>
    );
  }

  return <PaymentMethodReport />;
};

export default PaymentMethodReportPage;
