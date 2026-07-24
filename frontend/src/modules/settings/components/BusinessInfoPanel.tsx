import React, { useState } from "react";
import { useAppSelector } from "@/hooks/useRedux";
import { DEFAULT_BUSINESS_INFO, SETTINGS_UI } from "@/constants/settings";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { Save, Building2, CheckCircle2, AlertCircle } from "lucide-react";

export const BusinessInfoPanel: React.FC = () => {
  const household = useAppSelector((state) => state.auth.user?.household);
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  // Load from localStorage or Redux/Fallback
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("household_info");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      name: household?.name || DEFAULT_BUSINESS_INFO.NAME,
      taxCode: household?.taxCode || DEFAULT_BUSINESS_INFO.TAX_CODE,
      phone: household?.phoneNumber || DEFAULT_BUSINESS_INFO.PHONE_NUMBER,
      address: household?.address || DEFAULT_BUSINESS_INFO.ADDRESS,
      representative: "Nguyễn Văn Việt",
    };
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // TC-03: Tên cửa hàng & địa chỉ bắt buộc
    if (!formData.name.trim()) {
      newErrors.name = "Tên hộ kinh doanh không được để trống";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Địa chỉ cửa hàng không được để trống";
    }

    // TC-02: Mã số thuế đúng định dạng (10 hoặc 13 chữ số)
    const taxCodeClean = formData.taxCode.trim();
    if (!taxCodeClean) {
      newErrors.taxCode = "Mã số thuế không được để trống";
    } else if (!/^\d{10}(\d{3})?$/.test(taxCodeClean)) {
      newErrors.taxCode = "Mã số thuế không hợp lệ (Phải bao gồm 10 hoặc 13 chữ số)";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone.trim())) {
      newErrors.phone = "Số điện thoại không hợp lệ (Ví dụ: 0988888888)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showError("Thông tin cập nhật không hợp lệ. Vui lòng kiểm tra lại các trường báo lỗi!");
      return;
    }

    localStorage.setItem("household_info", JSON.stringify(formData));
    showSuccess("Cập nhật thông tin hộ kinh doanh thành công và đã đồng bộ lên hệ thống!");
    addLogEntry("CẬP_NHẬT_THÔNG_TIN_HỘ", `Hộ kinh doanh ${formData.name}`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 w-full">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-kv-blue-primary rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                {SETTINGS_UI.BUSINESS_INFO.TITLE}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Cập nhật thông tin đăng ký hộ kinh doanh hiển thị trên hóa đơnGTGT
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên hộ kinh doanh */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.NAME} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`border ${
                  errors.name ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white`}
                placeholder="Nhập tên hộ kinh doanh cá thể..."
              />
              {errors.name && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.name}
                </span>
              )}
            </div>

            {/* Mã số thuế */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.TAX_CODE} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.taxCode}
                onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                className={`border ${
                  errors.taxCode ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold font-mono tracking-wider text-slate-800 bg-white`}
                placeholder="Nhập mã số thuế (10 hoặc 13 số)..."
              />
              {errors.taxCode && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.taxCode}
                </span>
              )}
            </div>

            {/* Số điện thoại */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.PHONE} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`border ${
                  errors.phone ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white`}
                placeholder="Nhập số điện thoại liên hệ..."
              />
              {errors.phone && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.phone}
                </span>
              )}
            </div>

            {/* Người đại diện */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Người đại diện pháp luật:</label>
              <input
                type="text"
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                className="border border-slate-300 h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white"
                placeholder="Tên chủ hộ đại diện..."
              />
            </div>

            {/* Địa chỉ cửa hàng */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.ADDRESS} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`border ${
                  errors.address ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white`}
                placeholder="Nhập địa chỉ đăng ký kinh doanh..."
              />
              {errors.address && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.address}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-xs">
            <CheckCircle2 className="w-5 h-5 text-kv-blue-primary shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">
              Thông tin cấu hình sau khi lưu sẽ tự động xuất hiện trên tất cả hóa đơn điện tử VAT phát hành mới và hóa đơn tra cứu công khai.
            </span>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-6 h-10 rounded-lg transition-colors flex items-center gap-2 text-xs shadow-sm"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi thông tin hộ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
