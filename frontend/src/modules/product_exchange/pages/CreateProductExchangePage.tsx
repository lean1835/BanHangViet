import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useNotification } from "@/hooks/useNotification";
import { APP_ROUTES } from "@/constants/routes";
import { EXTRA_PAYMENT_METHODS, type TExtraPaymentMethod } from "@/constants/productExchange";
import { InvoiceSelectSection } from "../components/InvoiceSelectSection";
import { ReturnItemsSection, type SelectedReturnItemRow } from "../components/ReturnItemsSection";
import { NewItemsSection, type SelectedNewItemRow } from "../components/NewItemsSection";
import { ExchangeSummaryPanel } from "../components/ExchangeSummaryPanel";
import { ProductExchangeDetailModal } from "../components/ProductExchangeDetailModal";
import { ProductExchangePrintModal } from "../components/ProductExchangePrintModal";
import { ProductExchangeSidebar } from "../components/ProductExchangeSidebar";
import {
  useCheckExchangeEligibilityMutation,
  useCreateProductExchangeMutation,
} from "../services/productExchangeApi";
import { useGetInvoiceQuery } from "@/modules/e_invoice/services/eInvoiceApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IProductExchangeTicket } from "../types/IProductExchange";

export const CreateProductExchangePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialInvoiceId = searchParams.get("invoiceId");

  const { showSuccess, showError, showWarning } = useNotification();

  // State: Selected Invoice & Items
  const [selectedInvoice, setSelectedInvoice] = useState<IInvoice | null>(null);
  const [returnItems, setReturnItems] = useState<SelectedReturnItemRow[]>([]);
  const [exchangeItems, setExchangeItems] = useState<SelectedNewItemRow[]>([]);
  const [extraPaymentMethod, setExtraPaymentMethod] = useState<TExtraPaymentMethod>(
    EXTRA_PAYMENT_METHODS.CASH
  );
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // Modals after creation
  const [createdTicket, setCreatedTicket] = useState<IProductExchangeTicket | null>(null);
  const [printingTicket, setPrintingTicket] = useState<IProductExchangeTicket | null>(null);

  // Queries & Mutations
  const { data: initialInvoiceData } = useGetInvoiceQuery(initialInvoiceId || "", {
    skip: !initialInvoiceId,
  });

  const [checkEligibility, { data: eligibilityData, isLoading: isCheckingEligibility }] =
    useCheckExchangeEligibilityMutation();

  const [createExchange, { isLoading: isSubmitting }] = useCreateProductExchangeMutation();

  // Populate return items when invoice is loaded or selected
  const handleSelectInvoice = useCallback((invoice: IInvoice) => {
    setSelectedInvoice(invoice);

    // Chỉ lấy các mặt hàng bán ra thực tế, loại trừ các dòng ghi trừ đổi trả từ lần trước (giá âm hoặc tiền tố Đổi trả:)
    const validItems = (invoice.items || []).filter(
      (item) => (item.unitPrice ?? 0) > 0 && !item.productName?.startsWith("Đổi trả:")
    );

    const rows: SelectedReturnItemRow[] = validItems.map((item) => {
      const soldQty = item.quantity || 1;
      return {
        invoiceItemId: item.id || `item-${item.productId}`,
        productId: item.productId || "",
        productName: item.productName || "Sản phẩm",
        unit: item.unit || "Cái",
        unitPrice: item.unitPrice || 0,
        availableQuantity: soldQty,
        returnQuantity: 1,
        isSelected: false,
      };
    });

    setReturnItems(rows);
    setExchangeItems([]);
  }, []);

  // Preload invoice if query param exists
  useEffect(() => {
    if (initialInvoiceData?.result && !selectedInvoice) {
      handleSelectInvoice(initialInvoiceData.result);
    }
  }, [initialInvoiceData, selectedInvoice, handleSelectInvoice]);

  // Handlers for Return Items
  const handleToggleReturnSelect = (invoiceItemId: string) => {
    setReturnItems((prev) =>
      prev.map((i) => (i.invoiceItemId === invoiceItemId ? { ...i, isSelected: !i.isSelected } : i))
    );
  };

  const handleUpdateReturnQuantity = (invoiceItemId: string, newQty: number) => {
    setReturnItems((prev) =>
      prev.map((i) => {
        if (i.invoiceItemId !== invoiceItemId) return i;
        const clamped = Math.max(1, Math.min(newQty, i.availableQuantity));
        return { ...i, returnQuantity: clamped };
      })
    );
  };

  // Handlers for Exchange Items
  const handleAddExchangeItem = (product: IProduct) => {
    setExchangeItems((prev) => {
      const exists = prev.some((i) => i.productId === product.id);
      if (exists) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit || "Cái",
          unitPrice: product.price || 0,
          stockQuantity: product.stockQuantity || 0,
          exchangeQuantity: 1,
          taxRatePercentage: 0,
        },
      ];
    });
  };

  const handleRemoveExchangeItem = (productId: string) => {
    setExchangeItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleUpdateExchangeQuantity = (productId: string, newQty: number) => {
    setExchangeItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const clamped = Math.max(1, Math.min(newQty, i.stockQuantity));
        return { ...i, exchangeQuantity: clamped };
      })
    );
  };

  // Totals calculations
  const totalReturnAmount = useMemo(() => {
    return returnItems
      .filter((i) => i.isSelected)
      .reduce((sum, i) => sum + i.unitPrice * i.returnQuantity, 0);
  }, [returnItems]);

  const totalExchangeAmount = useMemo(() => {
    return exchangeItems.reduce((sum, i) => sum + i.unitPrice * i.exchangeQuantity, 0);
  }, [exchangeItems]);

  const differenceAmount = useMemo(() => {
    return totalExchangeAmount - totalReturnAmount;
  }, [totalExchangeAmount, totalReturnAmount]);

  const selectedReturnItemsList = useMemo(() => {
    return returnItems.filter((i) => i.isSelected);
  }, [returnItems]);

  // Debounced API check with backend when selections change
  useEffect(() => {
    if (selectedInvoice && selectedReturnItemsList.length > 0 && exchangeItems.length > 0) {
      const timer = setTimeout(() => {
        checkEligibility({
          originalInvoiceId: selectedInvoice.id || "",
          returnItems: selectedReturnItemsList.map((i) => ({
            invoiceItemId: i.invoiceItemId,
            productId: i.productId,
            quantity: i.returnQuantity,
          })),
          exchangeItems: exchangeItems.map((i) => ({
            productId: i.productId,
            quantity: i.exchangeQuantity,
          })),
        })
          .unwrap()
          .catch((_err) => {
            // Silently handle error or log
          });
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [selectedInvoice, selectedReturnItemsList, exchangeItems, checkEligibility]);

  // Handle redirect to return tickets flow (TC-03)
  const handleRedirectToReturn = () => {
    if (selectedInvoice) {
      navigate(`${APP_ROUTES.RETURN_TICKET_CREATE}?invoiceId=${selectedInvoice.id}`);
    } else {
      navigate(APP_ROUTES.RETURN_TICKET_CREATE);
    }
  };

  // Submit Handler
  const handleSubmitExchange = async () => {
    if (!selectedInvoice) {
      showWarning("Vui lòng chọn hóa đơn gốc trước khi lập phiếu");
      return;
    }

    if (selectedReturnItemsList.length === 0) {
      showWarning("Vui lòng chọn ít nhất một mặt hàng khách cần trả lại");
      return;
    }

    if (exchangeItems.length === 0) {
      showWarning("Vui lòng chọn ít nhất một mặt hàng khách muốn đổi sang");
      return;
    }

    if (eligibilityData?.result && !eligibilityData.result.isEligible) {
      showError(
        eligibilityData.result.message ||
          "Hóa đơn này không đủ điều kiện đổi hàng theo quy định (đã từng đổi/trả hoặc quá hạn)."
      );
      return;
    }

    if (differenceAmount < -0.01) {
      showError("Món đổi sang có giá thấp hơn. Vui lòng chuyển sang luồng Trả hàng theo quy định.");
      return;
    }

    try {
      const res = await createExchange({
        originalInvoiceId: selectedInvoice.id || "",
        returnItems: selectedReturnItemsList.map((i) => ({
          invoiceItemId: i.invoiceItemId,
          productId: i.productId,
          quantity: i.returnQuantity,
        })),
        exchangeItems: exchangeItems.map((i) => ({
          productId: i.productId,
          quantity: i.exchangeQuantity,
        })),
        extraPaymentMethod: differenceAmount > 0.01 ? extraPaymentMethod : undefined,
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();

      const ticket = res.result;
      if (ticket) {
        showSuccess(
          `Lập phiếu đổi hàng ${ticket.ticketNumber} thành công! Tồn kho đã được cập nhật 2 chiều.`
        );
        setCreatedTicket(ticket);
      }
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể lập phiếu đổi hàng. Vui lòng thử lại."));
    }
  };

  return (
    <DashboardWorkspaceLayout sidebar={<ProductExchangeSidebar disabled />}>
      <div className="w-full space-y-6 flex-1">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.PRODUCT_EXCHANGES)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              Lập Phiếu Đổi Hàng
            </h1>
          </div>
        </div>

        <InvoiceSelectSection
          selectedInvoice={selectedInvoice}
          onSelectInvoice={handleSelectInvoice}
          onClearInvoice={() => {
            setSelectedInvoice(null);
            setReturnItems([]);
            setExchangeItems([]);
          }}
          eligibilityData={eligibilityData?.result}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReturnItemsSection
            items={returnItems}
            onToggleSelect={handleToggleReturnSelect}
            onUpdateQuantity={handleUpdateReturnQuantity}
          />

          <NewItemsSection
            items={exchangeItems}
            onAddItem={handleAddExchangeItem}
            onRemoveItem={handleRemoveExchangeItem}
            onUpdateQuantity={handleUpdateExchangeQuantity}
          />
        </div>

        <ExchangeSummaryPanel
          totalReturnAmount={totalReturnAmount}
          totalExchangeAmount={totalExchangeAmount}
          differenceAmount={differenceAmount}
          eligibilityData={eligibilityData?.result}
          isCheckingEligibility={isCheckingEligibility}
          extraPaymentMethod={extraPaymentMethod}
          onChangePaymentMethod={setExtraPaymentMethod}
          reason={reason}
          onChangeReason={setReason}
          notes={notes}
          onChangeNotes={setNotes}
          onSubmitExchange={handleSubmitExchange}
          onRedirectToReturn={handleRedirectToReturn}
          isSubmitting={isSubmitting}
          hasReturnItems={selectedReturnItemsList.length > 0}
          hasExchangeItems={exchangeItems.length > 0}
        />
      </div>

      {/* Modal: Ticket Detail / Success */}
      {createdTicket && (
        <ProductExchangeDetailModal
          ticket={createdTicket}
          onClose={() => {
            setCreatedTicket(null);
            navigate(APP_ROUTES.PRODUCT_EXCHANGES);
          }}
          onPrint={(t) => {
            setCreatedTicket(null);
            setPrintingTicket(t);
          }}
        />
      )}

      {/* Modal: Print Ticket */}
      {printingTicket && (
        <ProductExchangePrintModal
          ticket={printingTicket}
          onClose={() => {
            setPrintingTicket(null);
            navigate(APP_ROUTES.PRODUCT_EXCHANGES);
          }}
        />
      )}
    </DashboardWorkspaceLayout>
  );
};

export default CreateProductExchangePage;
