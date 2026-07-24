import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  taxRateSchema,
  type TTaxRateFormData,
} from "../schemas/settingsSchemas";
import {
  useGetAllTaxRatesQuery,
  useCreateTaxRateMutation,
  useUpdateTaxRateStatusMutation,
} from "../services/settingsApi";
import { SETTINGS_UI } from "@/constants/settings";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  Plus,
  Percent,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  BookOpen,
  Loader2,
} from "lucide-react";

interface TaxSectorPreset {
  id: string;
  label: string;
  name: string;
  vatRate: number;
}

// Khung thuế suất chuẩn đối với Hộ kinh doanh theo Thông tư 40/2021/TT-BTC
const TAX_SECTOR_PRESETS: TaxSectorPreset[] = [
  {
    id: "DISTRIBUTION",
    label: "Phân phối, cung cấp hàng hóa (GTGT 1.0% - TNCN 0.5%)",
    name: "VAT-01 (Phân phối, cung cấp hàng hóa)",
    vatRate: 1.0,
  },
  {
    id: "SERVICES",
    label: "Dịch vụ, ăn uống, thi công không bao thầu (GTGT 5.0% - TNCN 2.0%)",
    name: "VAT-05 (Dịch vụ, ăn uống, thi công)",
    vatRate: 5.0,
  },
  {
    id: "PRODUCTION",
    label: "Sản xuất, vận tải, dịch vụ gắn hàng hóa (GTGT 3.0% - TNCN 1.5%)",
    name: "VAT-03 (Sản xuất, vận tải, dịch vụ hàng hóa)",
    vatRate: 3.0,
  },
  {
    id: "OTHER",
    label: "Hoạt động kinh doanh khác (GTGT 2.0% - TNCN 1.0%)",
    name: "VAT-02 (Hoạt động kinh doanh khác)",
    vatRate: 2.0,
  },
  {
    id: "EXEMPT",
    label: "Không chịu thuế / Miễn thuế (GTGT 0.0% - TNCN 0.0%)",
    name: "VAT-00 (Miễn thuế / Không chịu thuế)",
    vatRate: 0.0,
  },
];

export const TaxRateSettings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  // API Query & Mutations
  const {
    data: response,
    isLoading: isFetching,
    isError: isFetchError,
  } = useGetAllTaxRatesQuery();
  const [createTaxRate, { isLoading: isCreating }] = useCreateTaxRateMutation();
  const [updateTaxRateStatus] = useUpdateTaxRateStatusMutation();

  const taxRates = response?.result || [];

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TTaxRateFormData>({
    resolver: zodResolver(taxRateSchema),
    defaultValues: {
      name: "",
      ratePercentage: 0,
      isActive: true,
    },
  });

  // Select standard tax rate preset (Thông tư 40/2021/TT-BTC)
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = TAX_SECTOR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setValue("name", preset.name, { shouldValidate: true });
      setValue("ratePercentage", preset.vatRate, { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<TTaxRateFormData> = async (data) => {
    try {
      await createTaxRate({
        name: data.name,
        ratePercentage: data.ratePercentage,
        isActive: data.isActive,
      }).unwrap();

      showSuccess(`Thêm mới mức thuế suất "${data.name}" thành công!`);
      addLogEntry("THÊM_THUẾ_SUẤT", `${data.name} (${data.ratePercentage}%)`);

      reset();
      setSelectedPresetId("");
      setShowAddModal(false);
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(
        err,
        "Thêm mới mức thuế suất thất bại. Vui lòng kiểm tra lại!"
      );
      showError(errMsg);
    }
  };

  const handleToggleStatus = async (
    id: string,
    currentStatus: boolean,
    name: string
  ) => {
    try {
      const nextStatus = !currentStatus;
      await updateTaxRateStatus({
        id,
        body: { isActive: nextStatus },
      }).unwrap();

      showSuccess(
        `Đã thay đổi trạng thái thuế suất "${name}" sang ${
          nextStatus ? "Đang áp dụng" : "Ngừng áp dụng"
        }`
      );
      addLogEntry("CẬP_NHẬT_THUẾ_SUẤT", `${name} (${nextStatus ? "Áp dụng" : "Ngừng"})`);
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(
        err,
        "Cập nhật trạng thái thuế suất thất bại. Vui lòng thử lại!"
      );
      showError(errMsg);
    }
  };

  if (isFetching) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 text-kv-blue-primary animate-spin" />
        <span className="text-xs font-bold">Đang tải danh mục thuế suất từ máy chủ...</span>
      </div>
    );
  }

  if (isFetchError) {
    return (
      <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 text-rose-700 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span className="text-xs font-bold">
          Không thể kết nối máy chủ để lấy danh mục thuế suất. Vui lòng thử lại sau.
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 w-full">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                {SETTINGS_UI.TAX_RATE.TITLE}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Quản lý các tỷ lệ tính thuế GTGT áp dụng cho danh mục sản phẩm hộ kinh doanh
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              reset({ name: "", ratePercentage: 0, isActive: true });
              setSelectedPresetId("");
              setShowAddModal(true);
            }}
            className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-4 h-9 rounded-lg transition-colors flex items-center gap-2 text-xs shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Thêm mức thuế suất
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3">{SETTINGS_UI.TAX_RATE.COLUMNS.CODE}</th>
                <th className="p-3 text-right">{SETTINGS_UI.TAX_RATE.COLUMNS.VAT_RATE}</th>
                <th className="p-3 text-center">{SETTINGS_UI.TAX_RATE.COLUMNS.STATUS}</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {taxRates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                    Chưa có mức thuế suất nào được cấu hình trong CSDL.
                  </td>
                </tr>
              ) : (
                taxRates.map((taxRate) => (
                  <tr key={taxRate.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{taxRate.name}</td>
                    <td className="p-3 text-right font-bold text-kv-blue-primary">
                      {taxRate.ratePercentage}%
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded text-[10px] ${
                          taxRate.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {taxRate.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đang áp dụng
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" /> Ngừng áp dụng
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          handleToggleStatus(taxRate.id, taxRate.isActive, taxRate.name)
                        }
                        className={`text-[11px] font-bold px-3 py-1 rounded transition-colors ${
                          taxRate.isActive
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {taxRate.isActive ? "Tắt" : "Bật"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Thuế Suất Mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-auth-fade-in flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Percent className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">Thêm mức thuế suất mới</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4 text-xs">
              {/* Gợi ý Mẫu Ngành Nghề Kinh Doanh (TT 40/2021/TT-BTC) */}
              <div className="flex flex-col gap-1.5 bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl">
                <label className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Chọn mẫu ngành nghề (Thông tư 40/2021/TT-BTC)
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="border border-indigo-200 h-9 px-2 rounded-lg bg-white font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Tự nhập thủ công --</option>
                  {TAX_SECTOR_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-600/80 font-medium leading-tight">
                  Tự động điền tên và tỷ lệ % thuế GTGT chuẩn theo Thông tư 40.
                </p>
              </div>

              {/* Tên mức thuế */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">
                  Tên mức thuế / Nhóm hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="VD: VAT-01 (Phân phối, cung cấp hàng hóa)"
                  className={`border ${
                    errors.name ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary font-bold`}
                />
                {errors.name && (
                  <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors.name.message}
                  </span>
                )}
              </div>

              {/* Tỷ lệ phần trăm GTGT */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">
                  Tỷ lệ thuế GTGT (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register("ratePercentage")}
                  placeholder="VD: 1.0"
                  className={`border ${
                    errors.ratePercentage ? "border-rose-500" : "border-slate-300"
                  } h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary font-bold text-kv-blue-primary`}
                />
                {errors.ratePercentage && (
                  <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors.ratePercentage.message}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  {...register("isActive")}
                  className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                />
                <label htmlFor="isActiveCheck" className="font-bold text-slate-700 cursor-pointer">
                  Kích hoạt áp dụng ngay sau khi tạo
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 h-9 rounded-lg font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 h-9 rounded-lg font-bold bg-kv-blue-primary hover:bg-kv-blue-dark text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    "Lưu mức thuế"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
