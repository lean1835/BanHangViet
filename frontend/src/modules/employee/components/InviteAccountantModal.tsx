import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UserPlus,
  Calendar,
  ShieldCheck,
  Phone,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Info,
} from "lucide-react";
import {
  ACCESS_SCOPES,
  ACCESS_SCOPE_LABELS,
  type IAccountantInviteResult,
  type ICreateAccountantInviteRequest,
  type TAccessScope,
} from "../types/IAccountantInvitation";

interface InviteAccountantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ICreateAccountantInviteRequest) => Promise<IAccountantInviteResult | void>;
  isLoading: boolean;
}

export const InviteAccountantModal: React.FC<InviteAccountantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [accountantName, setAccountantName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [selectedScopes, setSelectedScopes] = useState<TAccessScope[]>([
    ACCESS_SCOPES.E_INVOICES,
    ACCESS_SCOPES.FINANCIAL_REPORTS,
    ACCESS_SCOPES.TAX_DECLARATION,
  ]);
  const [createAccountMode, setCreateAccountMode] = useState<"AUTO_GENERATE" | "MANUAL_PASSWORD">("AUTO_GENERATE");
  const [initialPassword, setInitialPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kết quả sau khi mời thành công để hiển thị thông tin tài khoản
  const [createdResult, setCreatedResult] = useState<IAccountantInviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAccountantName("");
      setPhoneNumber("");
      setEmail("");
      setExpiryDate(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 6);
        return d.toISOString().split("T")[0];
      });
      setSelectedScopes([
        ACCESS_SCOPES.E_INVOICES,
        ACCESS_SCOPES.FINANCIAL_REPORTS,
        ACCESS_SCOPES.TAX_DECLARATION,
      ]);
      setCreateAccountMode("AUTO_GENERATE");
      setInitialPassword("");
      setShowPassword(false);
      setError(null);
      setCreatedResult(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleScope = (scope: TAccessScope) => {
    if (selectedScopes.includes(scope)) {
      if (selectedScopes.length === 1) {
        setError("Vui lòng chọn ít nhất 1 phạm vi truy cập");
        return;
      }
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
      setError(null);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const loginUrl = window.location.origin + "/login";
    const info = `THÔNG TIN TÀI KHOẢN KẾ TOÁN THUÊ NGOÀI (BÁN HÀNG VIỆT)
- Họ và tên: ${createdResult.accountantName || accountantName}
- Tên đăng nhập: ${createdResult.accountantUsername || email}
- Mật khẩu tạm thời: ${createdResult.temporaryPassword || initialPassword || "(Đã gửi qua email)"}
- Đường dẫn đăng nhập: ${loginUrl}

(*) Lưu ý: Kế toán viên vui lòng đăng nhập và đổi mật khẩu mới trong lần đầu truy cập.`;

    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountantName.trim()) {
      setError("Vui lòng nhập họ và tên kế toán");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Vui lòng nhập số điện thoại kế toán");
      return;
    }
    if (!email.trim()) {
      setError("Vui lòng nhập email nhận thông báo tài khoản");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Định dạng email không hợp lệ (ví dụ: ketoan@gmail.com)");
      return;
    }
    if (createAccountMode === "MANUAL_PASSWORD") {
      if (!initialPassword.trim() || initialPassword.trim().length < 6) {
        setError("Mật khẩu ban đầu phải có ít nhất 6 ký tự");
        return;
      }
    }
    if (!expiryDate) {
      setError("Vui lòng chọn thời hạn truy cập");
      return;
    }
    if (selectedScopes.length === 0) {
      setError("Vui lòng chọn ít nhất 1 phạm vi truy cập");
      return;
    }

    setError(null);
    try {
      const result = await onSubmit({
        accountantName: accountantName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        scopes: selectedScopes,
        expiryDate,
        createAccountMode,
        initialPassword: createAccountMode === "MANUAL_PASSWORD" ? initialPassword.trim() : undefined,
      });

      if (result) {
        setCreatedResult(result);
      } else {
        onClose();
      }
    } catch {
      // Error handled by parent notification toast
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${createdResult ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-kv-blue-primary"}`}>
              {createdResult ? <CheckCircle2 size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {createdResult ? "Mời Kế Toán Thành Công" : "Mời Kế Toán Thuê Ngoài"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {createdResult
                  ? "Thông tin tài khoản và ủy quyền đã được gửi"
                  : "Ủy quyền có thời hạn để kế toán tra cứu sổ sách và hóa đơn"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* View 1: Kết quả sau khi mời thành công */}
        {createdResult ? (
          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-emerald-800 flex items-start gap-3">
              <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-900 text-sm">
                  Đã gửi lời mời tới {createdResult.accountantName || accountantName}!
                </p>
                <p className="text-emerald-700 text-[11px]">
                  Hệ thống đã gửi thư điện tử thông báo kèm đường dẫn truy cập tới:{" "}
                  <strong className="text-emerald-900 underline">{createdResult.accountantEmail || email}</strong>
                </p>
              </div>
            </div>

            {createdResult.isNewAccountCreated ? (
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-kv-blue-primary font-bold">
                  <Sparkles size={16} />
                  <span>Tài khoản kế toán mới vừa được khởi tạo:</span>
                </div>

                <div className="space-y-2 bg-white p-3 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Tên đăng nhập:</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 select-all">
                      {createdResult.accountantUsername}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Mật khẩu tạm thời:</span>
                    <span className="font-mono font-bold text-kv-blue-primary bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 select-all">
                      {createdResult.temporaryPassword || initialPassword}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Info size={13} className="text-slate-400 shrink-0" />
                    <span>Kế toán sẽ đổi mật khẩu ở lần đăng nhập đầu tiên.</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 hover:border-blue-400 text-kv-blue-primary hover:bg-blue-50 rounded-xl font-bold transition-all shadow-xs"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? "Đã sao chép!" : "Sao chép thông tin"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 flex items-start gap-2.5">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  Kế toán viên <strong>{createdResult.accountantName || accountantName}</strong> đã có tài khoản trên hệ thống Bán Hàng Việt. Lời mời đã được cập nhật vào danh sách chờ chấp nhận.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold transition-all shadow-md shadow-blue-500/20"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          /* View 2: Form nhập thông tin mời kế toán */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Họ và tên Kế toán <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Thị Hoa"
                  value={accountantName}
                  onChange={(e) => setAccountantName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-hidden font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Email nhận thông báo & tài khoản <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    placeholder="ketoan@domain.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Cơ chế cấp tài khoản nếu kế toán chưa có tài khoản */}
            <div className="space-y-2 pt-1">
              <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound size={15} className="text-kv-blue-primary" />
                <span>Cấp tài khoản mới</span>
                <span className="text-slate-400 font-normal">(nếu kế toán chưa có tài khoản)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => setCreateAccountMode("AUTO_GENERATE")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    createAccountMode === "AUTO_GENERATE"
                      ? "border-kv-blue-primary bg-blue-50/40 ring-1 ring-kv-blue-primary"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      name="accountMode"
                      checked={createAccountMode === "AUTO_GENERATE"}
                      onChange={() => setCreateAccountMode("AUTO_GENERATE")}
                      className="text-kv-blue-primary focus:ring-kv-blue-primary"
                    />
                    <span className="font-bold text-slate-800 text-xs">Mật khẩu tự động</span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 pl-5">
                    Hệ thống tự tạo mật khẩu tạm thời và gửi qua email cho kế toán.
                  </p>
                </div>

                <div
                  onClick={() => setCreateAccountMode("MANUAL_PASSWORD")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    createAccountMode === "MANUAL_PASSWORD"
                      ? "border-kv-blue-primary bg-blue-50/40 ring-1 ring-kv-blue-primary"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      name="accountMode"
                      checked={createAccountMode === "MANUAL_PASSWORD"}
                      onChange={() => setCreateAccountMode("MANUAL_PASSWORD")}
                      className="text-kv-blue-primary focus:ring-kv-blue-primary"
                    />
                    <span className="font-bold text-slate-800 text-xs">Chủ hộ tự đặt</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pl-5">
                    Chủ hộ tự thiết lập mật khẩu ban đầu và gửi cho kế toán.
                  </p>
                </div>
              </div>

              {createAccountMode === "MANUAL_PASSWORD" && (
                <div className="pt-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Mật khẩu ban đầu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Tối thiểu 6 ký tự"
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Thời hạn truy cập dữ liệu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={expiryDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Hệ thống sẽ tự động dừng quyền truy cập của kế toán khi tới ngày này.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-kv-blue-primary" />
                <span>Phạm vi dữ liệu chia sẻ (Scope)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {Object.entries(ACCESS_SCOPES).map(([key, value]) => {
                  const isChecked = selectedScopes.includes(value);
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleScope(value)}
                        className="rounded text-kv-blue-primary focus:ring-blue-500 h-4 w-4"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800">
                          {ACCESS_SCOPE_LABELS[value]}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {value === ACCESS_SCOPES.E_INVOICES &&
                            "Tra cứu danh sách hóa đơn, xuất file XML/PDF, lập hóa đơn điều chỉnh"}
                          {value === ACCESS_SCOPES.FINANCIAL_REPORTS &&
                            "Xem báo cáo doanh thu tổng hợp, báo cáo đối soát theo kỳ"}
                          {value === ACCESS_SCOPES.TAX_DECLARATION &&
                            "Lập bảng kê bán ra, tờ khai thuế mẫu 01/CNKD theo Thông tư 40/2021"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi lời mời</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
