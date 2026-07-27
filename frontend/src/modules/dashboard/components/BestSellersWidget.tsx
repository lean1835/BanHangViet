import { useMemo, useState } from "react";
import type { IProductRevenueProjection } from "@/modules/report/types/IReport";

interface BestSellersWidgetProps {
  topSellingProducts?: IProductRevenueProjection[];
}

export const BestSellersWidget = ({ topSellingProducts }: BestSellersWidgetProps) => {
  const [rankBy, setRankBy] = useState<"quantity" | "revenue">("quantity");

  const list = useMemo(() => {
    if (!topSellingProducts || topSellingProducts.length === 0) {
      return [];
    }

    // Sort accordingly client-side
    const sorted = [...topSellingProducts]
      .sort((a, b) => (rankBy === "quantity" ? b.quantitySold - a.quantitySold : b.revenue - a.revenue))
      .slice(0, 5);

    const colors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
    return sorted.map((item, idx) => ({
      name: item.productName,
      qty: item.quantitySold,
      revenue: item.revenue,
      color: colors[idx % colors.length],
    }));
  }, [topSellingProducts, rankBy]);

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
        {list.length === 0 ? (
          <div className="text-center text-slate-400 text-xs font-semibold py-8">
            Chưa có sản phẩm bán chạy trong khoảng thời gian này.
          </div>
        ) : (
          list.map((item, idx) => {
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
          })
        )}
      </div>
    </div>
  );
};
