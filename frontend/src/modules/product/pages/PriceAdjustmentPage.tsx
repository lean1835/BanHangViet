import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  History,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import {
  PRICE_ADJUSTMENT_COPY,
  PRICE_ADJUSTMENT_MESSAGES,
} from "@/constants/priceAdjustment";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  usePreviewPriceAdjustmentMutation,
  useApplyPriceAdjustmentMutation,
  useRevertPriceAdjustmentMutation,
} from "../services/priceAdjustmentApi";
import { PriceAdjustmentForm } from "../components/PriceAdjustmentForm";
import { PriceAdjustmentPreviewTable } from "../components/PriceAdjustmentPreviewTable";
import { PriceAdjustmentBatchListTable } from "../components/PriceAdjustmentBatchListTable";
import { PriceAdjustmentBatchDetailModal } from "../components/PriceAdjustmentBatchDetailModal";
import { RevertPriceAdjustmentModal } from "../components/RevertPriceAdjustmentModal";
import type {
  IPriceAdjustmentPreviewRequest,
  IPriceAdjustmentPreviewResponse,
  IPriceAdjustmentBatch,
} from "../types/IPriceAdjustment";

export interface PriceAdjustmentPageProps {
  onBack?: () => void;
  initialGroupId?: string;
}

export const PriceAdjustmentPage: React.FC<PriceAdjustmentPageProps> = ({
  onBack,
  initialGroupId,
}) => {
  const navigate = useNavigate();
  const { currentRole } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  // Role validation: Only Owner (VT-01) can perform price adjustments
  const isOwner = currentRole === USER_ROLES.OWNER;

  // Active tab: 'SETUP' or 'HISTORY'
  const [activeTab, setActiveTab] = useState<"SETUP" | "HISTORY">("SETUP");

  // Preview state
  const [previewRequest, setPreviewRequest] =
    useState<IPriceAdjustmentPreviewRequest | null>(null);
  const [previewResponse, setPreviewResponse] =
    useState<IPriceAdjustmentPreviewResponse | null>(null);

  // Modals state
  const [detailModalBatchId, setDetailModalBatchId] = useState<string | null>(null);
  const [revertModalBatch, setRevertModalBatch] =
    useState<IPriceAdjustmentBatch | null>(null);

  // Mutations
  const [previewMutation, { isLoading: isPreviewing }] =
    usePreviewPriceAdjustmentMutation();
  const [applyMutation, { isLoading: isApplying }] =
    useApplyPriceAdjustmentMutation();
  const [revertMutation, { isLoading: isReverting }] =
    useRevertPriceAdjustmentMutation();

  // Handlers
  const handlePreview = async (request: IPriceAdjustmentPreviewRequest) => {
    try {
      const res = await previewMutation(request).unwrap();
      setPreviewRequest(request);
      setPreviewResponse(res.result);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể tính toán xem trước"));
    }
  };

  const handleApply = async (batchName: string) => {
    if (!previewRequest) return;
    try {
      await applyMutation({
        name: batchName,
        targetGroupId: previewRequest.targetGroupId,
        productIds: previewRequest.productIds,
        adjustmentType: previewRequest.adjustmentType,
        adjustmentValue: previewRequest.adjustmentValue,
        roundingMethod: previewRequest.roundingMethod,
      }).unwrap();

      showSuccess(PRICE_ADJUSTMENT_MESSAGES.APPLY_SUCCESS);
      // Reset preview and navigate to History tab
      setPreviewResponse(null);
      setPreviewRequest(null);
      setActiveTab("HISTORY");
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể áp dụng điều chỉnh giá"));
    }
  };

  const handleConfirmRevert = async (batchId: string, revertReason: string) => {
    try {
      await revertMutation({ batchId, body: { revertReason } }).unwrap();
      showSuccess(PRICE_ADJUSTMENT_MESSAGES.REVERT_SUCCESS);
      setRevertModalBatch(null);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể hoàn tác đợt đổi giá"));
    }
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center gap-4 animate-auth-fade-in">
        <ShieldAlert className="w-16 h-16 text-rose-500" />
        <h2 className="text-lg font-extrabold text-slate-800">
          Quyền truy cập bị từ chối (403 Forbidden)
        </h2>
        <p className="text-sm text-slate-500 max-w-md">
          {PRICE_ADJUSTMENT_MESSAGES.PERMISSION_DENIED}. Vui lòng đăng nhập bằng tài khoản
          Chủ hộ hoặc chuyển vai trò Demo sang Chủ hộ để sử dụng chức năng này.
        </p>
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.PRODUCTS)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách hàng hóa
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full animate-auth-fade-in pb-12">
      {/* Page Header with Back Button directly inside the white card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onBack) onBack();
              else navigate(APP_ROUTES.PRODUCTS);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 active:scale-95 rounded-xl text-slate-700 text-xs font-bold transition-all shadow-2xs shrink-0"
            title="Quay lại danh mục hàng hóa"
            aria-label="Quay lại danh mục hàng hóa"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                {PRICE_ADJUSTMENT_COPY.PAGE_TITLE}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {PRICE_ADJUSTMENT_COPY.PAGE_SUBTITLE}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("SETUP")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === "SETUP"
                ? "bg-white text-kv-blue-primary shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{PRICE_ADJUSTMENT_COPY.TAB_SETUP}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === "HISTORY"
                ? "bg-white text-kv-blue-primary shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4" />
            <span>{PRICE_ADJUSTMENT_COPY.TAB_HISTORY}</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "SETUP" ? (
        <div className="flex flex-col gap-6">
          {/* Step 1: Form */}
          <PriceAdjustmentForm
            isLoading={isPreviewing}
            onPreview={handlePreview}
            initialGroupId={initialGroupId}
          />

          {/* Step 2: Preview table (if previewData exists) */}
          {previewResponse && (
            <PriceAdjustmentPreviewTable
              previewData={previewResponse}
              isApplying={isApplying}
              onApply={handleApply}
              onReset={() => {
                setPreviewResponse(null);
                setPreviewRequest(null);
              }}
            />
          )}
        </div>
      ) : (
        /* History Tab */
        <PriceAdjustmentBatchListTable
          onOpenDetail={(batchId) => setDetailModalBatchId(batchId)}
          onOpenRevert={(batch) => setRevertModalBatch(batch)}
        />
      )}

      {/* Batch Detail Modal */}
      <PriceAdjustmentBatchDetailModal
        batchId={detailModalBatchId}
        isOpen={Boolean(detailModalBatchId)}
        onClose={() => setDetailModalBatchId(null)}
      />

      {/* Revert Price Adjustment Modal */}
      <RevertPriceAdjustmentModal
        batch={revertModalBatch}
        isOpen={Boolean(revertModalBatch)}
        isReverting={isReverting}
        onClose={() => setRevertModalBatch(null)}
        onConfirm={handleConfirmRevert}
      />
    </div>
  );
};

export default PriceAdjustmentPage;
