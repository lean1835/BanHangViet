import { PRODUCT_STOCK_ENTRY_COPY } from "@/constants/product";
import type { IStockEntry } from "@/modules/product/types/IStockEntry";
import { formatCurrency } from "@/utils/formatCurrency";

interface StockEntryHistoryTableProps {
  stockEntries: IStockEntry[];
}

export const StockEntryHistoryTable = ({ stockEntries }: StockEntryHistoryTableProps) => (
  <div className="xl:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-auth-fade-in">
    <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
      {PRODUCT_STOCK_ENTRY_COPY.HISTORY_TITLE}
    </h3>

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
            <th className="p-3">{PRODUCT_STOCK_ENTRY_COPY.HISTORY_HEADERS.ID}</th>
            <th className="p-3">
              {PRODUCT_STOCK_ENTRY_COPY.HISTORY_HEADERS.TIME}
            </th>
            <th className="p-3">
              {PRODUCT_STOCK_ENTRY_COPY.HISTORY_HEADERS.PRODUCT}
            </th>
            <th className="p-3 text-right">
              {PRODUCT_STOCK_ENTRY_COPY.HISTORY_HEADERS.QUANTITY}
            </th>
            <th className="p-3 text-right">
              {PRODUCT_STOCK_ENTRY_COPY.HISTORY_HEADERS.IMPORT_PRICE}
            </th>
            <th className="p-3 text-right">
              {PRODUCT_STOCK_ENTRY_COPY.HISTORY_HEADERS.TOTAL}
            </th>
            <th className="p-3">
              {PRODUCT_STOCK_ENTRY_COPY.HISTORY_HEADERS.NOTES}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
          {stockEntries.map((stockEntry) => (
            <tr key={stockEntry.id} className="hover:bg-slate-50/50">
              <td className="p-3 font-mono font-bold text-slate-600">
                {stockEntry.id.toUpperCase()}
              </td>
              <td className="p-3 text-slate-500">{stockEntry.time}</td>
              <td className="p-3 font-bold">
                {stockEntry.name}{" "}
                <span className="font-mono text-slate-400 font-semibold">
                  ({stockEntry.sku})
                </span>
              </td>
              <td className="p-3 text-right font-bold text-indigo-600">{stockEntry.qty}</td>
              <td className="p-3 text-right">{formatCurrency(stockEntry.importPrice)}</td>
              <td className="p-3 text-right font-bold text-kv-blue-primary">
                {formatCurrency(stockEntry.total)}
              </td>
              <td
                className="p-3 text-slate-500 max-w-[200px] truncate"
                title={stockEntry.notes}
              >
                {stockEntry.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
