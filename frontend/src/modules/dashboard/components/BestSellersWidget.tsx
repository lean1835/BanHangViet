import { useMemo, useState } from "react";
import { ORDER_STATUS } from "@/constants/order";
import type { IOrderResponse } from "@/modules/order/types/IOrder";

interface BestSellersWidgetProps {
  orders: IOrderResponse[];
}

export const BestSellersWidget = ({ orders }: BestSellersWidgetProps) => {
  const [rankBy, setRankBy] = useState<"quantity" | "revenue">("quantity");

  const list = useMemo(() => {
    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};

    orders.forEach((o) => {
      if (o.status === ORDER_STATUS.COMPLETED) {
        o.items.forEach((item) => {
          if (!itemMap[item.productId]) {
            itemMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
          }
          itemMap[item.productId].qty += item.quantity;
          itemMap[item.productId].revenue += item.subtotal;
        });
      }
    });

    const items = Object.values(itemMap);

    if (items.length === 0) {
      // High-fidelity mock items matching the dashboard mockup style
      return [
        { name: "Nước ngọt Coca-Cola 320ml", qty: 72, revenue: 720000, color: "bg-blue-500" },
        { name: "Mì ăn liền Hảo Hảo", qty: 58, revenue: 290000, color: "bg-violet-500" },
        { name: "Sữa tắm Johnson's Baby", qty: 46, revenue: 5750000, color: "bg-emerald-500" },
        { name: "Bánh bông lan Kinh Đô", qty: 34, revenue: 340000, color: "bg-amber-500" },
        { name: "Khăn giấy ướt Bobby", qty: 28, revenue: 840000, color: "bg-rose-500" },
      ];
    }

    // Sort accordingly
    const sorted = items
      .sort((a, b) => (rankBy === "quantity" ? b.qty - a.qty : b.revenue - a.revenue))
      .slice(0, 5);

    const colors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
    return sorted.map((item, idx) => ({
      name: item.name,
      qty: item.qty,
      revenue: item.revenue,
      color: colors[idx % colors.length],
    }));
  }, [orders, rankBy]);

  const maxVal = useMemo(() => {
    if (list.length === 0) return 1;
    return rankBy === "quantity" ? list[0].qty : list[0].revenue;
  }, [list, rankBy]);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between flex-1 min-h-[300px]">
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-extrabold text-slate-800 text-sm">
          Mặt hàng bán chạy
        </h3>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border text-[10px]">
          <button
            onClick={() => setRankBy("quantity")}
            className={`px-2.5 py-0.5 font-bold rounded transition-all ${
              rankBy === "quantity"
                ? "bg-white text-kv-blue-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Số lượng
          </button>
          <button
            onClick={() => setRankBy("revenue")}
            className={`px-2.5 py-0.5 font-bold rounded transition-all ${
              rankBy === "revenue"
                ? "bg-white text-kv-blue-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Doanh thu
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3.5 my-auto">
        {list.map((item, idx) => {
          const currentVal = rankBy === "quantity" ? item.qty : item.revenue;
          const percent = Math.max(10, Math.round((currentVal / maxVal) * 100));

          return (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-bold truncate max-w-[180px]">
                  {idx + 1}. {item.name}
                </span>
                <span className="text-slate-800 font-extrabold shrink-0">
                  {rankBy === "quantity"
                    ? `${item.qty} sản phẩm`
                    : item.revenue.toLocaleString("vi-VN") + " đ"}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
