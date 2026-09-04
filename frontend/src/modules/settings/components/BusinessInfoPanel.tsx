import React, { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  householdInfoSchema,
  type THouseholdInfoFormData,
} from "../schemas/settingsSchemas";
import {
  useGetMyHouseholdQuery,
  useUpdateMyHouseholdMutation,
} from "../services/settingsApi";
import { SETTINGS_UI } from "@/constants/settings";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { saveOfflineConfig } from "@/modules/sync/utils/offlineSyncStorage";
import { Save, Building2, CheckCircle2, AlertCircle, Loader2, WifiOff } from "lucide-react";

export const BusinessInfoPanel: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  // API Query & Mutation
  const { data: response, isLoading: isFetching, isError: isFetchError } = useGetMyHouseholdQuery();
  const [updateMyHousehold, { isLoading: isUpdating }] = useUpdateMyHouseholdMutation();

  const household = response?.result;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<THouseholdInfoFormData>({
    resolver: zodResolver(householdInfoSchema),
    defaultValues: {
      name: "",
      taxCode: "",
      phoneNumber: "",
      address: "",
      representativeName: "",
      limitOrdersEnabled: true,
      offlineMaxOrders: 50,
      limitHoursEnabled: true,
      offlineMaxHours: 24,
    },
  });

  const limitOrdersEnabled = watch("limitOrdersEnabled");
  const limitHoursEnabled = watch("limitHoursEnabled");

  // Reset form when data is loaded from server API
  useEffect(() => {
    if (household) {
      const rawOrders = household.offlineMaxOrders;
      const rawHours = household.offlineMaxHours;

      const hasOrderLimit = typeof rawOrders === "number" ? rawOrders > 0 : true;
      const hasHourLimit = typeof rawHours === "number" ? rawHours > 0 : true;

      const maxOrders = typeof rawOrders === "number" && rawOrders > 0 ? rawOrders : 50;
      const maxHours = typeof rawHours === "number" && rawHours > 0 ? rawHours : 24;

      reset({
        name: household.name || "",
        taxCode: household.taxCode || "",
        phoneNumber: household.phoneNumber || "",
        address: household.address || "",
        representativeName: household.representativeName || "",
        limitOrdersEnabled: hasOrderLimit,
        offlineMaxOrders: maxOrders,
        limitHoursEnabled: hasHourLimit,
        offlineMaxHours: maxHours,
      });

      saveOfflineConfig({
        maxOrders: hasOrderLimit ? maxOrders : 0,
        maxHours: hasHourLimit ? maxHours : 0,
      });
    }
  }, [household, reset]);

  const onSubmit: SubmitHandler<THouseholdInfoFormData> = async (data) => {
    try {
      const effectiveMaxOrders = data.limitOrdersEnabled
        ? Number(data.offlineMaxOrders) || 50
        : 0;

      const effectiveMaxHours = data.limitHoursEnabled
        ? Number(data.offlineMaxHours) || 24
        : 0;

      await updateMyHousehold({
        name: data.name,
        taxCode: data.taxCode,
        address: data.address,
        phoneNumber: data.phoneNumber,
        representativeName: data.representativeName || undefined,
        offlineMaxOrders: effectiveMaxOrders,
        offlineMaxHours: effectiveMaxHours,
      }).unwrap();

      saveOfflineConfig({
        maxOrders: effectiveMaxOrders,
        maxHours: effectiveMaxHours,
      });

      showSuccess("Cập nhật thông tin hộ kinh doanh và cấu hình bán ngoại tuyến thành công!");
      addLogEntry("CẬP_NHẬT_THÔNG_TIN_HỘ", `Hộ kinh doanh ${data.name}`);
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(
        err,
        "Cập nhật thông tin hộ kinh doanh thất bại. Vui lòng kiểm tra lại!"
      );
      showError(errMsg);
    }
  };

  if (isFetching) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 text-kv-blue-primary animate-spin" />
        <span className="text-xs font-bold">Đang tải thông tin hộ kinh doanh từ máy chủ...</span>
      </div>
    );
  }

  if (isFetchError) {
    return (
      <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 text-rose-700 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span className="text-xs font-bold">
          Không thể kết nối máy chủ để lấy thông tin hộ kinh doanh. Vui lòng thử lại sau.
        </span>
      </div>
    );
  }

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
                Cập nhật thông tin đăng ký hộ kinh doanh hiển thị trên hóa đơn GTGT
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên hộ kinh doanh */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.NAME} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className={`border ${
                  errors.name ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white`}
                placeholder="Nhập tên hộ kinh doanh cá thể..."
              />
              {errors.name && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.name.message}
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
                {...register("taxCode")}
                className={`border ${
                  errors.taxCode ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold font-mono tracking-wider text-slate-800 bg-white`}
                placeholder="Nhập mã số thuế (10 hoặc 13 số)..."
              />
              {errors.taxCode && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.taxCode.message}
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
                {...register("phoneNumber")}
                className={`border ${
                  errors.phoneNumber ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white`}
                placeholder="Nhập số điện thoại liên hệ..."
              />
              {errors.phoneNumber && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.phoneNumber.message}
                </span>
              )}
            </div>

            {/* Người đại diện */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Người đại diện pháp luật:</label>
              <input
                type="text"
                {...register("representativeName")}
                className={`border ${
                  errors.representativeName ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white`}
                placeholder="Tên chủ hộ đại diện..."
              />
              {errors.representativeName && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.representativeName.message}
                </span>
              )}
            </div>

            {/* Địa chỉ cửa hàng */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.ADDRESS} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register("address")}
                className={`border ${
                  errors.address ? "border-rose-500" : "border-slate-300"
                } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white`}
                placeholder="Nhập địa chỉ đăng ký kinh doanh..."
              />
              {errors.address && (
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.address.message}
                </span>
              )}
            </div>

            {/* Cấu hình Giới hạn bán Ngoại tuyến (Offline POS) */}
            <div className="md:col-span-2 pt-5 border-t border-slate-100 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    Cấu hình Giới hạn bán hàng khi Mất mạng (Offline Mode)
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Chỉ Chủ hộ (VT-01) mới có quyền đặt số đơn và số giờ tối đa cho phép bán khi mất kết nối mạng.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Giới hạn số lượng đơn */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <label className="text-xs font-bold text-slate-800">
                      Giới hạn số đơn ngoại tuyến
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {limitOrdersEnabled ? "Bật giới hạn" : "Không giới hạn"}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={limitOrdersEnabled}
                          onChange={(e) =>
                            setValue("limitOrdersEnabled", e.target.checked, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-kv-blue-primary"></div>
                      </label>
                    </div>
                  </div>

                  {limitOrdersEnabled ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">
                          Số đơn tối đa được bán khi mất mạng: <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[11px] font-bold text-kv-blue-primary">1 - 1.000 đơn</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        {...register("offlineMaxOrders")}
                        className={`border ${
                          errors.offlineMaxOrders ? "border-rose-500" : "border-slate-300"
                        } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white`}
                        placeholder="Mặc định: 50 đơn..."
                      />
                      {errors.offlineMaxOrders ? (
                        <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.offlineMaxOrders.message}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          (Khi đạt ngưỡng, POS sẽ tạm dừng bán để yêu cầu kết nối mạng đồng bộ).
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="py-2.5 px-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-emerald-700 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Không giới hạn số lượng đơn khi mất mạng</span>
                    </div>
                  )}
                </div>

                {/* Card 2: Giới hạn thời gian */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <label className="text-xs font-bold text-slate-800">
                      Giới hạn thời gian ngoại tuyến
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {limitHoursEnabled ? "Bật giới hạn" : "Không giới hạn"}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={limitHoursEnabled}
                          onChange={(e) =>
                            setValue("limitHoursEnabled", e.target.checked, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-kv-blue-primary"></div>
                      </label>
                    </div>
                  </div>

                  {limitHoursEnabled ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">
                          Thời gian tối đa được bán khi mất mạng: <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[11px] font-bold text-kv-blue-primary">1 - 168 giờ</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={168}
                        {...register("offlineMaxHours")}
                        className={`border ${
                          errors.offlineMaxHours ? "border-rose-500" : "border-slate-300"
                        } h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800 bg-white`}
                        placeholder="Mặc định: 24 giờ..."
                      />
                      {errors.offlineMaxHours ? (
                        <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors.offlineMaxHours.message}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          (Tối đa 168 giờ = 7 ngày. Khi vượt quá thời gian, POS sẽ yêu cầu kết nối mạng).
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="py-2.5 px-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-emerald-700 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Không giới hạn thời gian khi mất mạng</span>
                    </div>
                  )}
                </div>
              </div>
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
              disabled={isUpdating}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-6 h-10 rounded-lg transition-colors flex items-center gap-2 text-xs shadow-sm disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu thay đổi thông tin hộ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
