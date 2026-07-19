import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_ORDER_PAYMENT_METHOD_LABEL,
  ORDER_FILTER_OPTIONS,
  ORDER_FILTER_STATUS,
  ORDER_PAYMENT_METHOD,
  ORDER_PAYMENT_METHOD_LABELS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_UI,
} from "@/constants/order";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
import { useGetActiveShiftQuery } from "@/modules/shift/services/shiftApi";
import {
  useCreateOrderMutation,
  useAddOrderItemMutation,
  useApplyDiscountMutation,
  useSetPaymentMethodMutation,
  useCompleteOrderMutation,
} from "@/modules/order/services/orderApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";

interface OrderHistoryTableProps {
  currentRole: string;
}

type TOrderFilterStatus =
  (typeof ORDER_FILTER_STATUS)[keyof typeof ORDER_FILTER_STATUS];

const formatNow = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};

interface ISelectedProductItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  taxRatePercentage?: number;
}

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({ currentRole: _currentRole }) => {
  const { orders, setOrders, customers, addLogEntry } = useDashboardDemo();
  
  // Fetch available products from the real API endpoint
  const { data: productsPageData } = useGetProductsQuery({ size: 100 });
  const availableProducts = productsPageData?.content || [];

  const { data: activeShiftData } = useGetActiveShiftQuery();
  const activeShift = activeShiftData?.result || null;

  const [createOrderApi] = useCreateOrderMutation();
  const [addOrderItemApi] = useAddOrderItemMutation();
  const [applyDiscountApi] = useApplyDiscountMutation();
  const [setPaymentMethodApi] = useSetPaymentMethodMutation();
  const [completeOrderApi] = useCompleteOrderMutation();

  const [orderFilterStatus, setOrderFilterStatus] = useState<TOrderFilterStatus>(
    ORDER_FILTER_STATUS.ALL
  );

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [selectedItems, setSelectedItems] = useState<ISelectedProductItem[]>([]);
  const [discountType, setDiscountType] = useState<"VALUE" | "PERCENT">("VALUE");
  const [discountValueInput, setDiscountValueInput] = useState<number>(0);
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [orderStatus, setOrderStatus] = useState<string>("COMPLETED");
  
  // Temp states for adding an item
  const [tempProductId, setTempProductId] = useState("");
  const [tempQuantity, setTempQuantity] = useState(1);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const translateStatus = (status: string) => {
    switch (status) {
      case ORDER_STATUS.CREATING:
        return ORDER_STATUS_LABELS[ORDER_STATUS.CREATING];
      case ORDER_STATUS.COMPLETED:
        return ORDER_STATUS_LABELS[ORDER_STATUS.COMPLETED];
      case ORDER_STATUS.CANCELED:
        return ORDER_STATUS_LABELS[ORDER_STATUS.CANCELED];
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case ORDER_STATUS.COMPLETED:
        return "bg-emerald-100 text-emerald-700";
      case ORDER_STATUS.CREATING:
        return "bg-slate-100 text-slate-600";
      case ORDER_STATUS.CANCELED:
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const totalPreTaxAmount = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalTaxAmount = selectedItems.reduce((sum, item) => sum + Math.round((item.unitPrice * item.quantity * (item.taxRatePercentage || 0)) / 100), 0);
  const totalAmount = totalPreTaxAmount + totalTaxAmount;
  
  const discountAmountInput = discountType === "VALUE"
    ? discountValueInput
    : Math.round((totalAmount * discountValueInput) / 100);

  const finalAmount = Math.max(0, totalAmount - discountAmountInput);

  const handleAddItem = () => {
    if (!tempProductId) return;
    const prod = availableProducts.find((p) => p.id === tempProductId);
    if (!prod) return;

    if (tempQuantity < 1) {
      alert("Số lượng sản phẩm phải tối thiểu là 1");
      return;
    }

    const existingIndex = selectedItems.findIndex((item) => item.productId === tempProductId);
    let updatedItems = [...selectedItems];

    if (existingIndex > -1) {
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + tempQuantity,
      };
    } else {
      updatedItems.push({
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        quantity: tempQuantity,
        unitPrice: prod.price,
        taxRatePercentage: prod.taxRatePercentage,
      });
    }

    setSelectedItems(updatedItems);
    
    // Auto-update total and customer paid amount
    const newTotal = updatedItems.reduce(
      (sum, item) =>
        sum +
        (item.unitPrice * item.quantity +
          Math.round((item.unitPrice * item.quantity * (item.taxRatePercentage || 0)) / 100)),
      0
    );
    const calculatedDiscount = discountType === "VALUE"
      ? discountValueInput
      : Math.round((newTotal * discountValueInput) / 100);
    const newFinal = Math.max(0, newTotal - calculatedDiscount);
    setPaidAmountInput(newFinal);

    // Reset temp inputs
    setTempProductId("");
    setTempQuantity(1);
    setErrors((prev) => {
      const { items: _, ...rest } = prev;
      return rest;
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);

    const newTotal = updatedItems.reduce(
      (sum, item) =>
        sum +
        (item.unitPrice * item.quantity +
          Math.round((item.unitPrice * item.quantity * (item.taxRatePercentage || 0)) / 100)),
      0
    );
    const calculatedDiscount = discountType === "VALUE"
      ? discountValueInput
      : Math.round((newTotal * discountValueInput) / 100);
    const newFinal = Math.max(0, newTotal - calculatedDiscount);
    setPaidAmountInput(newFinal);
  };

  const handleDiscountTypeChange = (type: "VALUE" | "PERCENT") => {
    setDiscountType(type);
    setDiscountValueInput(0);
    setPaidAmountInput(totalAmount);
  };

  const handleDiscountValueChange = (val: number) => {
    let checkedVal = val;
    if (discountType === "PERCENT") {
      checkedVal = Math.min(100, Math.max(0, val));
    } else {
      checkedVal = Math.min(totalAmount, Math.max(0, val));
    }
    setDiscountValueInput(checkedVal);

    const calculatedDiscount = discountType === "VALUE"
      ? checkedVal
      : Math.round((totalAmount * checkedVal) / 100);
    const newFinal = Math.max(0, totalAmount - calculatedDiscount);
    setPaidAmountInput(newFinal);
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (method === "CASH" || method === "BANK_TRANSFER") {
      setPaidAmountInput(finalAmount);
    } else if (method === "DEBT") {
      setPaidAmountInput(0);
    }
  };

  // Open Edit Mode Modal
  const handleOpenEditModal = (order: any) => {
    if (!activeShift) {
      alert("Bạn cần mở ca bán hàng trước khi chỉnh sửa đơn hàng!");
      return;
    }
    setEditingOrder(order);
    setCustomerId(order.customerId || "");
    setSelectedItems(
      order.items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );
    setDiscountType("VALUE");
    setDiscountValueInput(order.discountAmount || 0);
    setPaidAmountInput(order.finalAmount + (order.changeAmount || 0));
    setPaymentMethod(order.paymentMethod || "CASH");
    setOrderStatus(order.status || "COMPLETED");
    setErrors({});
    setShowCreateModal(true);
  };

  // Handle Delete order
  const handleDeleteOrder = (order: any) => {
    if (!activeShift) {
      alert("Bạn cần mở ca bán hàng trước khi xóa đơn hàng!");
      return;
    }
    const ok = window.confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${order.orderNumber}?`);
    if (!ok) return;

    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    addLogEntry("XÓA_ĐƠN_HÀNG", `Mã đơn hàng: ${order.orderNumber}`);
    alert("Xóa đơn hàng thành công!");
  };

  // Handle Modal Save (Create / Update)
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (selectedItems.length === 0) {
      newErrors.items = "Vui lòng chọn ít nhất 1 sản phẩm để tạo đơn hàng";
    }
    if (discountValueInput < 0) {
      newErrors.discount = "Giá trị giảm giá không được nhỏ hơn 0";
    }
    if (discountType === "PERCENT" && discountValueInput > 100) {
      newErrors.discount = "Giảm giá phần trăm không được vượt quá 100%";
    }
    if (discountType === "VALUE" && discountValueInput > totalAmount) {
      newErrors.discount = "Số tiền giảm giá không được vượt quá tổng tiền hàng";
    }
    if (paidAmountInput < 0) {
      newErrors.paidAmount = "Khách đã trả không được nhỏ hơn 0";
    }
    if ((paymentMethod === "CASH" || paymentMethod === "BANK_TRANSFER") && paidAmountInput < finalAmount) {
      newErrors.paidAmount = `Khách trả không đủ tiền thanh toán (tối thiểu ${finalAmount.toLocaleString("vi-VN")} đ)`;
    }
    if (paymentMethod === "DEBT" && !customerId) {
      newErrors.paidAmount = "Vui lòng chọn khách hàng cụ thể để ghi nợ";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === customerId);
    const customerName = selectedCustomer ? selectedCustomer.name : null;

    try {
      if (editingOrder) {
        // Edit Mode: Update locally as before (finalized orders are read-only on backend)
        const changeAmount = Math.max(0, paidAmountInput - finalAmount);
        const formattedDate = formatNow();
        const itemsMapped = selectedItems.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          orderId: editingOrder.orderNumber,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          discountAmount: 0,
          finalPrice: item.unitPrice * item.quantity,
          createdAt: editingOrder.createdAt,
          updatedAt: formattedDate,
        }));

        const updatedOrder = {
          ...editingOrder,
          customerId: customerId || null,
          customerName: customerName,
          totalAmount: totalAmount,
          discountAmount: discountAmountInput,
          finalAmount: finalAmount,
          paymentMethod: paymentMethod as any,
          paymentStatus: paymentMethod === "DEBT" ? "UNPAID" : "PAID",
          status: orderStatus as any,
          items: itemsMapped,
          changeAmount: changeAmount,
          updatedAt: formattedDate,
        };

        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? updatedOrder : o)));
        
        const itemDetails = selectedItems.map((i) => `${i.productName} (x${i.quantity})`).join(", ");
        const logDetails = `Khách: ${customerName || "Khách vãng lai"} - SP: [${itemDetails}] - Tổng tiền: ${finalAmount.toLocaleString("vi-VN")} đ`;
        addLogEntry("CẬP_NHẬT_ĐƠN_HÀNG", `Mã đơn hàng: ${editingOrder.orderNumber} - ${logDetails}`);
        
        alert("Cập nhật đơn hàng thành công!");
      } else {
        // Create Mode: Call actual backend API endpoints in sequence!
        
        // 1. Create order
        const createRes = await createOrderApi({ customerId: customerId || undefined }).unwrap();
        const createdOrder = createRes.result;
        const orderId = createdOrder.id;

        // 2. Add each product item
        for (const item of selectedItems) {
          await addOrderItemApi({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
          }).unwrap();
        }

        // 3. Apply discount if set
        if (discountValueInput > 0) {
          await applyDiscountApi({
            orderId,
            discountType: discountType === "PERCENT" ? "PERCENTAGE" : "CASH",
            discountValue: discountValueInput,
          }).unwrap();
        }

        // 4. Set payment method and paid amount
        await setPaymentMethodApi({
          orderId,
          paymentMethod: paymentMethod as any,
          amountGiven: paidAmountInput,
        }).unwrap();

        // 5. Complete order
        const finalRes = await completeOrderApi({
          orderId,
          amountGiven: paidAmountInput,
        }).unwrap();

        // Add completed order from database to context list
        setOrders((prev) => [finalRes.result, ...prev]);

        const itemDetails = selectedItems.map((i) => `${i.productName} (x${i.quantity})`).join(", ");
        const logDetails = `Khách: ${customerName || "Khách vãng lai"} - SP: [${itemDetails}] - Tổng tiền: ${finalAmount.toLocaleString("vi-VN")} đ`;
        addLogEntry("TẠO_ĐƠN_HÀNG", `Mã đơn hàng: ${finalRes.result.orderNumber} - ${logDetails}`);

        alert("Tạo đơn hàng thành công trên hệ thống!");
      }

      // Reset Form
      setCustomerId("");
      setSelectedItems([]);
      setDiscountType("VALUE");
      setDiscountValueInput(0);
      setPaidAmountInput(0);
      setPaymentMethod("CASH");
      setOrderStatus("COMPLETED");
      setErrors({});
      setEditingOrder(null);
      setShowCreateModal(false);
    } catch (err: any) {
      alert(`Lỗi xử lý đơn hàng trên hệ thống: ${err?.data?.message || err?.message || "Đã có lỗi xảy ra"}`);
    }
  };

  const handleCloseCreateModal = () => {
    setCustomerId("");
    setSelectedItems([]);
    setDiscountType("VALUE");
    setDiscountValueInput(0);
    setPaidAmountInput(0);
    setPaymentMethod("CASH");
    setOrderStatus("COMPLETED");
    setErrors({});
    setEditingOrder(null);
    setShowCreateModal(false);
  };

  const filteredOrders = orders.filter(
    (order) =>
      orderFilterStatus === ORDER_FILTER_STATUS.ALL || order.status === orderFilterStatus
  );

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b pb-4 mb-2 flex-wrap gap-3">
        <span className="font-extrabold text-sm text-slate-800">
          {ORDER_UI.HISTORY.TITLE(filteredOrders.length)}
        </span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">
              {ORDER_UI.HISTORY.STATUS_FILTER_LABEL}
            </span>
            <select
              value={orderFilterStatus}
              onChange={(e) => setOrderFilterStatus(e.target.value as TOrderFilterStatus)}
              className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs bg-white font-bold text-slate-700"
            >
              {ORDER_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (!activeShift) {
                alert("Bạn cần mở ca bán hàng trước khi tạo đơn hàng!");
                return;
              }
              setShowCreateModal(true);
            }}
            className={`${
              activeShift ? "bg-kv-green hover:bg-emerald-600 text-white" : "bg-slate-300 text-slate-500 cursor-not-allowed"
            } font-bold h-8 px-4 rounded-lg shadow-sm text-xs transition-colors flex items-center gap-1.5`}
          >
            <span>+ Tạo đơn hàng</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.ORDER_NUMBER}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.CASHIER}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.CREATED_AT}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.CUSTOMER}</th>
              <th className="p-3 text-right">{ORDER_UI.HISTORY.COLUMNS.TOTAL_AMOUNT}</th>
              <th className="p-3 text-right">{ORDER_UI.HISTORY.COLUMNS.DISCOUNT}</th>
              <th className="p-3 text-right">{ORDER_UI.HISTORY.COLUMNS.PAID_AMOUNT}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.PAYMENT_METHOD}</th>
              <th className="p-3 text-center">{ORDER_UI.HISTORY.COLUMNS.STATUS}</th>
              <th className="p-3 text-center">{ORDER_UI.HISTORY.COLUMNS.ACTIONS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                  {ORDER_UI.HISTORY.EMPTY_MESSAGE}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetailModal(true);
                  }}
                  className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-slate-800">{order.orderNumber}</td>
                  <td className="p-3 text-slate-700 font-semibold">{order.createdByUsername}</td>
                  <td className="p-3 text-slate-500">{formatDate(order.createdAt)}</td>
                  <td className="p-3 font-bold text-slate-700">
                    {order.customerName || ORDER_UI.HISTORY.WALK_IN_CUSTOMER_LABEL}
                  </td>
                  <td className="p-3 text-right">{formatCurrency(order.totalAmount)}</td>
                  <td className="p-3 text-right text-rose-500 font-semibold">
                    -{formatCurrency(order.discountAmount)}
                  </td>
                  <td className="p-3 text-right font-bold text-kv-blue-primary">
                    {formatCurrency(order.finalAmount)}
                  </td>
                  <td className="p-3 text-slate-600 font-bold">
                    {order.paymentMethod === ORDER_PAYMENT_METHOD.CASH
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.CASH]
                      : order.paymentMethod === ORDER_PAYMENT_METHOD.BANK_TRANSFER
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.BANK_TRANSFER]
                      : order.paymentMethod === ORDER_PAYMENT_METHOD.DEBT
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.DEBT]
                      : DEFAULT_ORDER_PAYMENT_METHOD_LABEL}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {translateStatus(order.status)}
                    </span>
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {order.id.startsWith("ord") ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(order)}
                          title="Sửa đơn hàng"
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 p-1.5 rounded transition-all flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          title="Xóa đơn hàng"
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded transition-all flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1 select-none">
                        Hệ thống
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Tạo / Cập nhật đơn hàng mới */}
      {showCreateModal && createPortal(
        <div
          onClick={handleCloseCreateModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-backdrop-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-[460px] w-full overflow-hidden flex flex-col my-4 text-left font-semibold text-slate-700 text-xs animate-modal-bounce-in"
          >
            {/* Header */}
            <div className="bg-kv-blue-primary text-white px-4 py-2.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {editingOrder ? `✏️ Cập Nhật Đơn Hàng: ${editingOrder.orderNumber}` : "Tạo Đơn Hàng Bán Lẻ Mới"}
              </h2>
              <button
                onClick={handleCloseCreateModal}
                type="button"
                className="text-white/80 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-3 flex flex-col gap-2.5">
              {errors.items && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-2 rounded-lg text-[10px] font-bold">
                  ⚠️ {errors.items}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                {/* Khách hàng */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Khách hàng:
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs"
                  >
                    <option value="">-- Khách vãng lai --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn sản phẩm bán */}
                <div className="flex flex-col gap-1.5 col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 text-[9px] uppercase block mb-0.5">
                    Chọn sản phẩm bán hàng:
                  </span>
                  
                  <div className="flex flex-col gap-1.5">
                    {/* Hàng 1: Dropdown chọn sản phẩm */}
                    <div className="flex flex-col gap-0.5 w-full">
                      <label className="text-slate-400 text-[8px] font-bold uppercase">Sản phẩm:</label>
                      <select
                        value={tempProductId}
                        onChange={(e) => setTempProductId(e.target.value)}
                        className="border border-slate-300 h-8 px-2 rounded-lg bg-white text-xs focus:outline-none w-full"
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - Giá: {formatCurrency(p.price)} (Tồn: {p.stockQuantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hàng 2: Nhập số lượng & Nút thêm */}
                    <div className="flex gap-2 items-end w-full">
                      <div className="flex-1 flex flex-col gap-0.5">
                        <label className="text-slate-400 text-[8px] font-bold uppercase">Số lượng:</label>
                        <input
                          type="number"
                          min="1"
                          value={tempQuantity}
                          onChange={(e) => setTempQuantity(Math.max(1, Number(e.target.value)))}
                          className="border border-slate-300 h-8 px-2 rounded-lg text-xs font-bold text-center w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold h-8 px-4 rounded-lg text-[11px] transition-colors shrink-0"
                      >
                        Thêm sản phẩm
                      </button>
                    </div>
                  </div>

                  {/* List of selected items */}
                  {selectedItems.length > 0 && (
                    <div className="mt-2 max-h-[85px] overflow-y-auto border rounded-lg bg-white">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b text-[8px]">
                            <th className="p-1.5">Sản phẩm</th>
                            <th className="p-1.5 text-center">SL</th>
                            <th className="p-1.5 text-right">Đơn giá</th>
                            <th className="p-1.5 text-right">Thành tiền</th>
                            <th className="p-1.5 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                          {selectedItems.map((item, index) => (
                            <tr key={item.productId} className="hover:bg-slate-50/50">
                              <td className="p-1.5 max-w-[150px] truncate">
                                <div className="font-bold text-slate-800 truncate" title={item.productName}>{item.productName}</div>
                                <div className="text-[8px] text-slate-400 font-mono">{item.productSku}</div>
                              </td>
                              <td className="p-1.5 text-center font-bold">{item.quantity}</td>
                              <td className="p-1.5 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="p-1.5 text-right text-slate-800 font-bold">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </td>
                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-rose-600 hover:text-rose-800 text-[10px] font-bold"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Tổng tiền hàng (Tự động tính) */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Tổng tiền hàng (đ):
                  </label>
                  <div className="border border-slate-200 bg-slate-50 h-8 px-2.5 rounded-lg flex items-center text-xs font-bold text-slate-500 w-full">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>

                {/* Loại giảm giá */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Loại giảm giá:
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => handleDiscountTypeChange(e.target.value as "VALUE" | "PERCENT")}
                    className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs w-full"
                  >
                    <option value="VALUE">Tiền mặt (đ)</option>
                    <option value="PERCENT">Phần trăm (%)</option>
                  </select>
                </div>

                {/* Giá trị giảm giá */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    {discountType === "VALUE" ? "Nhập số tiền giảm (đ):" : "Nhập phần trăm giảm (%):"}
                  </label>
                  <input
                    type="number"
                    value={discountValueInput}
                    min="0"
                    max={discountType === "PERCENT" ? 100 : totalAmount}
                    onChange={(e) => handleDiscountValueChange(Number(e.target.value))}
                    className={`border ${errors.discount ? "border-rose-500" : "border-slate-300"} h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold w-full`}
                  />
                  <span className="text-[8px] text-slate-400 font-semibold mt-0.5">
                    Trị giá giảm: {formatCurrency(discountAmountInput)}
                  </span>
                  {errors.discount && (
                    <span className="text-[8px] text-rose-500 font-bold">{errors.discount}</span>
                  )}
                </div>

                {/* Khách đã trả */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Khách thực tế đã trả (đ)*:
                  </label>
                  <input
                    type="number"
                    value={paidAmountInput}
                    min="0"
                    onChange={(e) => setPaidAmountInput(Number(e.target.value))}
                    required
                    className={`border ${errors.paidAmount ? "border-rose-500" : "border-slate-300"} h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold w-full`}
                  />
                  <span className="text-[8px] text-slate-400 font-semibold mt-0.5">
                    Khách trả: {formatCurrency(paidAmountInput)}
                  </span>
                  {errors.paidAmount && (
                    <span className="text-[8px] text-rose-500 font-bold">{errors.paidAmount}</span>
                  )}
                </div>

                {/* Phải thanh toán (Final Amount) & Tiền thối lại banner */}
                <div className="flex flex-col gap-1.5 col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs font-bold text-slate-700">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                    <span>Tổng tiền (chưa thuế):</span>
                    <span>{formatCurrency(totalPreTaxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                    <span>Thuế VAT:</span>
                    <span className="text-slate-600">+{formatCurrency(totalTaxAmount)}</span>
                  </div>
                  {discountAmountInput > 0 && (
                    <div className="flex justify-between items-center text-[10px] text-rose-500 font-semibold">
                      <span>Giảm giá:</span>
                      <span>-{formatCurrency(discountAmountInput)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-1.5 mt-0.5 text-slate-800">
                    <span>CẦN THANH TOÁN:</span>
                    <span className="text-xs font-extrabold text-kv-blue-primary">
                      {formatCurrency(finalAmount)}
                    </span>
                  </div>
                  {paidAmountInput > finalAmount && (
                    <div className="flex justify-between items-center text-[9px] font-bold text-emerald-600 border-t pt-1 mt-0.5">
                      <span>TIỀN THỐI LẠI:</span>
                      <span className="font-extrabold text-xs">
                        {formatCurrency(paidAmountInput - finalAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Phương thức thanh toán */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Phương thức thanh toán:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs w-full"
                  >
                    <option value={ORDER_PAYMENT_METHOD.CASH}>
                      {ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.CASH]}
                    </option>
                    <option value={ORDER_PAYMENT_METHOD.BANK_TRANSFER}>
                      {ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.BANK_TRANSFER]}
                    </option>
                    <option value={ORDER_PAYMENT_METHOD.DEBT}>
                      {ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.DEBT]}
                    </option>
                  </select>
                </div>

                {/* Trạng thái đơn */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Trạng thái đơn:
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs w-full"
                  >
                    <option value={ORDER_STATUS.COMPLETED}>
                      {ORDER_STATUS_LABELS[ORDER_STATUS.COMPLETED]}
                    </option>
                    <option value={ORDER_STATUS.CREATING}>
                      {ORDER_STATUS_LABELS[ORDER_STATUS.CREATING]}
                    </option>
                    <option value={ORDER_STATUS.CANCELED}>
                      {ORDER_STATUS_LABELS[ORDER_STATUS.CANCELED]}
                    </option>
                  </select>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="submit"
                  className="flex-1 bg-kv-green hover:bg-emerald-600 text-white font-bold h-8 rounded-lg transition-colors text-xs"
                >
                  {editingOrder ? "LƯU THAY ĐỔI" : "XÁC NHẬN TẠO ĐƠN"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold h-9 rounded-lg transition-colors text-xs"
                >
                  HỦY BỎ
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Chi tiết đơn hàng */}
      {showDetailModal && selectedOrder && createPortal(
        <div
          onClick={() => setShowDetailModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-backdrop-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col my-4 text-left font-semibold text-slate-700 text-xs animate-modal-bounce-in"
          >
            {/* Header */}
            <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>Chi Tiết Đơn Hàng: {selectedOrder.orderNumber}</span>
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                type="button"
                className="text-white/80 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Thông tin chung */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] mb-0.5">Nhân viên chốt:</span>
                  <span className="font-extrabold text-slate-800">{selectedOrder.createdByUsername}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] mb-0.5">Thời gian tạo:</span>
                  <span className="font-extrabold text-slate-800">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] mb-0.5">Khách hàng:</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedOrder.customerName || "Khách vãng lai"}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] mb-0.5">Trạng thái:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5 ${getStatusBadgeClass(
                      selectedOrder.status
                    )}`}
                  >
                    {translateStatus(selectedOrder.status)}
                  </span>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1.5">
                  Sản phẩm đã mua:
                </span>
                <div className="overflow-x-auto border rounded-lg bg-white">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b">
                        <th className="p-2.5">Sản phẩm</th>
                        <th className="p-2.5 text-center">SL</th>
                        <th className="p-2.5 text-right">Đơn giá</th>
                        <th className="p-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item: any) => (
                          <tr key={item.id}>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-800">{item.productName}</div>
                              {item.productSku && <div className="text-[9px] text-slate-400 font-mono">{item.productSku}</div>}
                            </td>
                            <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                            <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2.5 text-right text-slate-800 font-bold">
                              {formatCurrency(item.subtotal || item.totalPrice || (item.unitPrice * item.quantity))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 font-medium">
                            Không có chi tiết sản phẩm cho đơn hàng này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chi tiết thanh toán */}
              <div className="bg-slate-50 p-4 rounded-lg border flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tiền hàng:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-500">
                  <span>Giảm giá:</span>
                  <span className="font-bold">-{formatCurrency(selectedOrder.discountAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-slate-800 font-bold">
                  <span>Cần thanh toán:</span>
                  <span className="font-extrabold text-kv-blue-primary">
                    {formatCurrency(selectedOrder.finalAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-500">Khách đã trả:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedOrder.finalAmount + (selectedOrder.changeAmount || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiền thối lại:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedOrder.changeAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phương thức thanh toán:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.paymentMethod === ORDER_PAYMENT_METHOD.CASH
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.CASH]
                      : selectedOrder.paymentMethod === ORDER_PAYMENT_METHOD.BANK_TRANSFER
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.BANK_TRANSFER]
                      : selectedOrder.paymentMethod === ORDER_PAYMENT_METHOD.DEBT
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.DEBT]
                      : DEFAULT_ORDER_PAYMENT_METHOD_LABEL}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold h-9 px-6 rounded-lg transition-colors text-xs"
                >
                  ĐÓNG
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
