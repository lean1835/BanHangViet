import React, { useState } from "react";
import { SETTINGS_UI } from "@/constants/settings";
import { MOCK_TAX_RATES } from "@/constants/mockData/settings";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { Plus, Percent, CheckCircle2, XCircle, AlertCircle, X, BookOpen } from "lucide-react";

interface TaxRateItem {
  code: string;
  description: string;
  vatRateLabel: string;
  vatRateValue: number;
  personalIncomeTaxRateLabel: string;
  personalIncomeTaxRateValue: number;
  status: "ACTIVE" | "INACTIVE";
}

interface TaxSectorPreset {
  id: string;
  label: string;
  codePrefix: string;
  vatRate: number;
  pitRate: number;
  description: string;
}

// Khung thuế suất chuẩn đối với Hộ kinh doanh theo Thông tư 40/2021/TT-BTC
const TAX_SECTOR_PRESETS: TaxSectorPreset[] = [
  {
    id: "DISTRIBUTION",
    label: "Phân phối, cung cấp hàng hóa (GTGT 1.0% - TNCN 0.5%)",
    codePrefix: "VAT-01",
    vatRate: 1.0,
    pitRate: 0.5,
    description: "Ngành bán buôn, bán lẻ hàng hóa thông thường",
  },
  {
    id: "SERVICES",
    label: "Dịch vụ, ăn uống, thi công không bao thầu (GTGT 5.0% - TNCN 2.0%)",
    codePrefix: "VAT-05",
    vatRate: 5.0,
    pitRate: 2.0,
    description: "Ngành dịch vụ, ăn uống, thi công xây dựng không bao thầu NVL",
  },
  {
    id: "PRODUCTION",
    label: "Sản xuất, vận tải, dịch vụ gắn hàng hóa (GTGT 3.0% - TNCN 1.5%)",
    codePrefix: "VAT-03",
    vatRate: 3.0,
    pitRate: 1.5,
    description: "Ngành sản xuất, vận tải, dịch vụ có gắn với hàng hóa",
  },
  {
    id: "OTHER",
    label: "Hoạt động kinh doanh khác (GTGT 2.0% - TNCN 1.0%)",
    codePrefix: "VAT-02",
    vatRate: 2.0,
    pitRate: 1.0,
    description: "Hoạt động kinh doanh khác",
  },
  {
    id: "EXEMPT",
    label: "Không chịu thuế / Miễn thuế (GTGT 0.0% - TNCN 0.0%)",
    codePrefix: "VAT-00",
    vatRate: 0.0,
    pitRate: 0.0,
    description: "Hàng hóa, dịch vụ không thuộc diện chịu thuế",
  },
];

// Hàm tự động tra % Thuế TNCN tương ứng theo tỷ lệ % GTGT nhập vào theo luật thuế HKD
const getAutoPitFromVat = (vat: number): number => {
  if (vat === 1.0) return 0.5;
  if (vat === 3.0) return 1.5;
  if (vat === 5.0) return 2.0;
  if (vat === 2.0) return 1.0;
  if (vat === 0.0) return 0.0;
  // Trường hợp nhập % GTGT khác: tự tính ước lệ theo tỷ lệ chuẩn
  return Math.round(vat * 0.4 * 10) / 10;
};

export const TaxRateSettings: React.FC = () => {
  const { showSuccess } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  // Dynamic tax rates list
  const [taxRates, setTaxRates] = useState<TaxRateItem[]>(() => {
    const saved = localStorage.getItem("tax_rates_list");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return MOCK_TAX_RATES.map((item) => ({
      code: item.code,
      description: item.description,
      vatRateLabel: item.vatRateLabel,
      vatRateValue: parseFloat(item.vatRateLabel.replace("%", "")) || 0,
      personalIncomeTaxRateLabel: item.personalIncomeTaxRateLabel,
      personalIncomeTaxRateValue: parseFloat(item.personalIncomeTaxRateLabel.replace("%", "")) || 0,
      status: "ACTIVE" as const,
    }));
  });

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVat, setNewVat] = useState<number | "">(0);
  const [newPit, setNewPit] = useState<number | "">(0);
  const [isPitManuallyEdited, setIsPitManuallyEdited] = useState(false);
  const [formError, setFormError] = useState("");

  const saveTaxRatesToStorage = (updated: TaxRateItem[]) => {
    setTaxRates(updated);
    localStorage.setItem("tax_rates_list", JSON.stringify(updated));
  };

  const handleToggleStatus = (code: string) => {
    const updated = taxRates.map((item) => {
      if (item.code === code) {
        const nextStatus = item.status === "ACTIVE" ? ("INACTIVE" as const) : ("ACTIVE" as const);
        showSuccess(`Đã thay đổi trạng thái thuế suất ${item.code} sang ${nextStatus === "ACTIVE" ? "Áp dụng" : "Ngừng áp dụng"}`);
        addLogEntry("CẬP_NHẬT_THUẾ_SUẤT", `${item.code} (${nextStatus})`);
        return { ...item, status: nextStatus };
      }
      return item;
    });
    saveTaxRatesToStorage(updated);
  };

  // Chọn mẫu thuế suất kinh doanh chuẩn từ Dropdown
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setFormError("");
    const preset = TAX_SECTOR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setNewCode(preset.codePrefix);
      setNewDesc(preset.description);
      setNewVat(preset.vatRate);
      setNewPit(preset.pitRate);
      setIsPitManuallyEdited(false);
    }
  };

  // Cập nhật % GTGT và tự động nhảy % TNCN
  const handleVatChange = (valStr: string) => {
    setFormError("");
    if (valStr === "") {
      setNewVat("");
      if (!isPitManuallyEdited) {
        setNewPit("");
      }
      return;
    }
    const vatVal = parseFloat(valStr);
    setNewVat(isNaN(vatVal) ? "" : vatVal);

    if (!isPitManuallyEdited && !isNaN(vatVal)) {
      setNewPit(getAutoPitFromVat(vatVal));
    }
  };

  // Người dùng tự đè % Thuế TNCN
  const handlePitChange = (valStr: string) => {
    setFormError("");
    setIsPitManuallyEdited(true);
    if (valStr === "") {
      setNewPit("");
    } else {
      const pitVal = parseFloat(valStr);
      setNewPit(isNaN(pitVal) ? "" : pitVal);
    }
  };

  const handleAddTaxRate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newCode.trim() || !newDesc.trim()) {
      setFormError("Vui lòng nhập đầy đủ Mã ngành và Mô tả thuế suất");
      return;
    }

    const vatNum = typeof newVat === "number" ? newVat : 0;
    const pitNum = typeof newPit === "number" ? newPit : 0;

    // TC-02: Chặn số âm
    if (vatNum < 0 || pitNum < 0) {
      setFormError("Tỷ lệ thuế suất không được là số âm!");
      return;
    }
    if (vatNum > 100 || pitNum > 100) {
      setFormError("Tỷ lệ thuế suất không được vượt quá 100%!");
      return;
    }

    // TC-03: Chặn trùng lặp
    const cleanCode = newCode.trim().toUpperCase();
    if (taxRates.some((item) => item.code.toUpperCase() === cleanCode)) {
      setFormError(`Mã ngành/thuế "${cleanCode}" đã tồn tại trong danh mục!`);
      return;
    }

    const newItem: TaxRateItem = {
      code: cleanCode,
      description: newDesc.trim(),
      vatRateLabel: `${vatNum}%`,
      vatRateValue: vatNum,
      personalIncomeTaxRateLabel: `${pitNum}%`,
      personalIncomeTaxRateValue: pitNum,
      status: "ACTIVE",
    };

    const updated = [...taxRates, newItem];
    saveTaxRatesToStorage(updated);
    showSuccess(`Thêm mới mức thuế suất ${newItem.code} thành công!`);
    addLogEntry("THÊM_THUẾ_SUẤT", `Mức thuế ${newItem.code}`);

    // Reset Form
    setNewCode("");
    setNewDesc("");
    setNewVat(0);
    setNewPit(0);
    setSelectedPresetId("");
    setIsPitManuallyEdited(false);
    setShowAddModal(false);
  };

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
                Quản lý các tỷ lệ tính thuế GTGT và thuế TNCN theo ngành nghề áp dụng
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setNewCode("");
              setNewDesc("");
              setNewVat(0);
              setNewPit(0);
              setSelectedPresetId("");
              setIsPitManuallyEdited(false);
              setFormError("");
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
                <th className="p-3">{SETTINGS_UI.TAX_RATE.COLUMNS.DESCRIPTION}</th>
                <th className="p-3 text-right">{SETTINGS_UI.TAX_RATE.COLUMNS.VAT_RATE}</th>
                <th className="p-3 text-right">{SETTINGS_UI.TAX_RATE.COLUMNS.PERSONAL_INCOME_TAX_RATE}</th>
                <th className="p-3 text-center">{SETTINGS_UI.TAX_RATE.COLUMNS.STATUS}</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {taxRates.map((taxRate) => (
                <tr key={taxRate.code} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-800">{taxRate.code}</td>
                  <td className="p-3 font-bold text-slate-700">{taxRate.description}</td>
                  <td className="p-3 text-right font-bold text-kv-blue-primary">
                    {taxRate.vatRateLabel}
                  </td>
                  <td className="p-3 text-right font-bold text-indigo-600">
                    {taxRate.personalIncomeTaxRateLabel}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded text-[10px] ${taxRate.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                    >
                      {taxRate.status === "ACTIVE" ? (
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
                      onClick={() => handleToggleStatus(taxRate.code)}
                      className={`text-[11px] font-bold px-3 py-1 rounded transition-colors ${taxRate.status === "ACTIVE"
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                    >
                      {taxRate.status === "ACTIVE" ? "Tắt" : "Bật"}
                    </button>
                  </td>
                </tr>
              ))}
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

            <form onSubmit={handleAddTaxRate} className="p-5 flex flex-col gap-4 text-xs">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

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
                  Tự động điền tỷ lệ GTGT & TNCN chuẩn theo nhóm ngành nghề kinh doanh của hộ.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">
                  Mã ngành / Thuế <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="VD: VAT-01"
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">
                  Mô tả nhóm hàng hóa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="VD: Ngành bán buôn, bán lẻ hàng hóa thông thường"
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Tỷ lệ thuế GTGT (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newVat}
                    onChange={(e) => handleVatChange(e.target.value)}
                    className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary font-bold text-kv-blue-primary"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">Tỷ lệ thuế TNCN (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newPit}
                    onChange={(e) => handlePitChange(e.target.value)}
                    className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary font-bold text-indigo-600"
                    required
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                * Thuế TNCN được gợi ý tự động theo tỷ lệ % GTGT. Bạn vẫn có thể chỉnh sửa thủ công nếu thuộc đối tượng đặc biệt.
              </p>

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
                  className="px-5 h-9 rounded-lg font-bold bg-kv-blue-primary hover:bg-kv-blue-dark text-white transition-colors"
                >
                  Lưu mức thuế
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

