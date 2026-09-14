import React, { useState, useEffect } from "react";
import { Award, Save, Sparkles, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import {
  useGetLoyaltyConfigQuery,
  useUpdateLoyaltyConfigMutation,
} from "@/modules/customer/services/loyaltyApi";
import { useNotification } from "@/hooks/useNotification";
import { formatCurrency } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  LOYALTY_DEFAULT_CONFIG,
  LOYALTY_CONFIG_LIMITS,
} from "@/constants/loyalty";

export const LoyaltyProgramSettingsPage: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { data: config, isLoading: isFetching, refetch } = useGetLoyaltyConfigQuery();
  const [updateLoyaltyConfig, { isLoading: isSaving }] = useUpdateLoyaltyConfigMutation();

  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [spendAmountPerPoint, setSpendAmountPerPoint] = useState<number>(
    LOYALTY_DEFAULT_CONFIG.SPEND_AMOUNT_PER_POINT
  );
  const [pointValue, setPointValue] = useState<number>(
    LOYALTY_DEFAULT_CONFIG.POINT_VALUE
  );
  const [minPointsToRedeem, setMinPointsToRedeem] = useState<number>(
    LOYALTY_DEFAULT_CONFIG.MIN_POINTS_TO_REDEEM
  );
  const [maxRedeemRatePerOrder, setMaxRedeemRatePerOrder] = useState<number>(
    LOYALTY_DEFAULT_CONFIG.MAX_REDEEM_RATE_PER_ORDER
  );
  const [pointExpiryDays, setPointExpiryDays] = useState<number>(
    LOYALTY_DEFAULT_CONFIG.POINT_EXPIRY_DAYS
  );

  useEffect(() => {
    if (config) {
      setIsEnabled(Boolean(config.isEnabled));
      setSpendAmountPerPoint(
        Number(config.spendAmountPerPoint) || LOYALTY_DEFAULT_CONFIG.SPEND_AMOUNT_PER_POINT
      );
      setPointValue(
        Number(config.pointValue) || LOYALTY_DEFAULT_CONFIG.POINT_VALUE
      );
      setMinPointsToRedeem(
        config.minPointsToRedeem != null
          ? Number(config.minPointsToRedeem)
          : LOYALTY_DEFAULT_CONFIG.MIN_POINTS_TO_REDEEM
      );
      setMaxRedeemRatePerOrder(
        Number(config.maxRedeemRatePerOrder) || LOYALTY_DEFAULT_CONFIG.MAX_REDEEM_RATE_PER_ORDER
      );
      setPointExpiryDays(
        config.pointExpiryDays != null
          ? Number(config.pointExpiryDays)
          : LOYALTY_DEFAULT_CONFIG.POINT_EXPIRY_DAYS
      );
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (spendAmountPerPoint < LOYALTY_CONFIG_LIMITS.MIN_SPEND_AMOUNT_PER_POINT) {
      showError(
        `Số tiền chi tiêu tương ứng 1 điểm phải từ ${formatCurrency(
          LOYALTY_CONFIG_LIMITS.MIN_SPEND_AMOUNT_PER_POINT
        )} trở lên`
      );
      return;
    }
    if (pointValue < LOYALTY_CONFIG_LIMITS.MIN_POINT_VALUE) {
      showError(
        `Giá trị quy đổi 1 điểm phải từ ${formatCurrency(
          LOYALTY_CONFIG_LIMITS.MIN_POINT_VALUE
        )} trở lên`
      );
      return;
    }
    if (minPointsToRedeem < LOYALTY_CONFIG_LIMITS.MIN_POINTS_TO_REDEEM) {
      showError("Mức điểm tối thiểu để đổi không được âm");
      return;
    }
    if (
      maxRedeemRatePerOrder < LOYALTY_CONFIG_LIMITS.MIN_MAX_REDEEM_RATE ||
      maxRedeemRatePerOrder > LOYALTY_CONFIG_LIMITS.MAX_MAX_REDEEM_RATE
    ) {
      showError(
        `Tỷ lệ đổi điểm tối đa trên đơn phải từ ${LOYALTY_CONFIG_LIMITS.MIN_MAX_REDEEM_RATE}% đến ${LOYALTY_CONFIG_LIMITS.MAX_MAX_REDEEM_RATE}%`
      );
      return;
    }
    if (pointExpiryDays < LOYALTY_CONFIG_LIMITS.MIN_EXPIRY_DAYS) {
      showError("Hạn sử dụng điểm không được âm (0 là không hết hạn)");
      return;
    }

    try {
      await updateLoyaltyConfig({
        isEnabled,
        spendAmountPerPoint,
        pointValue,
        minPointsToRedeem,
        maxRedeemRatePerOrder,
        pointExpiryDays,
      }).unwrap();

      showSuccess("Cập nhật cấu hình chương trình tích điểm thành công!");
      refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Cập nhật cấu hình thất bại"));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">
              Cấu hình Tích điểm & Đổi điểm khách thân thiết
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Thiết lập tỷ lệ quy đổi, điều kiện tích lũy và hạn sử dụng điểm thưởng cho cửa hàng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isEnabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {isEnabled ? "Đang kích hoạt" : "Đang tạm dừng"}
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Kích hoạt */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">
                1. Trạng thái chương trình
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bật hoặc tắt cơ chế tích điểm tự động khi hoàn tất đơn hàng và đổi điểm tại quầy thu ngân.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Card 2: Quy tắc tích điểm */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            2. Quy tắc tích lũy điểm thưởng (EARN)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Số tiền chi tiêu tương ứng 1 điểm (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={100}
                step={1000}
                value={spendAmountPerPoint}
                onChange={(e) => setSpendAmountPerPoint(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ví dụ: Đặt <strong>10.000 ₫</strong> = Khi khách thực trả 100.000 ₫ sẽ tích được 10 điểm.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 space-y-1">
                <strong className="text-slate-800 block">Quy tắc bảo vệ doanh thu:</strong>
                <p>
                  • Điểm chỉ được tích trên <strong>phần tiền thực trả</strong> (tiền mặt, chuyển khoản).
                </p>
                <p>
                  • <strong>Tuyệt đối không tích điểm</strong> trên khoản tiền ghi nợ chưa thu hoặc khoản được giảm giá.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Quy tắc đổi điểm */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            3. Quy tắc đổi điểm thanh toán (REDEEM)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Giá trị quy đổi 1 điểm (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                step={100}
                value={pointValue}
                onChange={(e) => setPointValue(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Mặc định: 1 điểm = {formatCurrency(pointValue)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Điểm tối thiểu để đổi <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={minPointsToRedeem}
                onChange={(e) => setMinPointsToRedeem(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Khách cần tích tối thiểu {minPointsToRedeem} điểm mới được dùng.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tỷ lệ đổi tối đa / đơn (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxRedeemRatePerOrder}
                onChange={(e) => setMaxRedeemRatePerOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tối đa {maxRedeemRatePerOrder}% giá trị thanh toán của đơn.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Hạn sử dụng điểm */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800">
            4. Hạn sử dụng điểm thưởng (EXPIRED)
          </h2>

          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Thời hạn điểm (Số ngày) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={pointExpiryDays}
              onChange={(e) => setPointExpiryDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Nhập <strong>0</strong> nếu điểm thưởng không bao giờ hết hạn. (Mặc định: 365 ngày).
            </p>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Chỉ Chủ hộ kinh doanh mới có quyền cập nhật cấu hình này.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving || isFetching}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Đang lưu cấu hình..." : "Lưu cấu hình"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoyaltyProgramSettingsPage;
