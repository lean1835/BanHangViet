import type { FormEventHandler } from "react";
import {
  PRODUCT_STOCK_ENTRY_COPY,
  PRODUCT_STOCK_ENTRY_DEFAULTS,
  PRODUCT_STOCK_ENTRY_FORM_FIELDS,
} from "@/constants/product";
import { USER_ROLES } from "@/constants/roles";
import type { TDemoRole } from "@/constants/roles";
import type { IProduct } from "@/modules/product/types/IProduct";

interface StockEntryFormProps {
  currentRole: TDemoRole;
  products: IProduct[];
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export const StockEntryForm = ({ currentRole, products, onSubmit }: StockEntryFormProps) => (
  <div className="xl:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-start animate-auth-fade-in">
    <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-4">
      {PRODUCT_STOCK_ENTRY_COPY.FORM_TITLE}
    </h3>
    {currentRole !== USER_ROLES.OWNER ? (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-slate-500 font-semibold">
        <svg className="w-10 h-10 text-amber-500 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-[11px] leading-relaxed block font-bold text-slate-600">
          {PRODUCT_STOCK_ENTRY_COPY.ACCOUNTANT_READ_ONLY_MESSAGE}
        </span>
      </div>
    ) : (
      <form onSubmit={onSubmit} className="flex flex-col gap-4 font-semibold text-slate-700">
        <div className="flex flex-col gap-1">
          <label>{PRODUCT_STOCK_ENTRY_COPY.PRODUCT_LABEL}</label>
          <select
            name={PRODUCT_STOCK_ENTRY_FORM_FIELDS.PRODUCT_ID}
            required
            className="border border-slate-300 h-9 px-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs bg-white font-bold"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label>{PRODUCT_STOCK_ENTRY_COPY.QUANTITY_LABEL}</label>
            <input
              type="number"
              name={PRODUCT_STOCK_ENTRY_FORM_FIELDS.QUANTITY}
              required
              min={PRODUCT_STOCK_ENTRY_DEFAULTS.MIN_QUANTITY}
              defaultValue={PRODUCT_STOCK_ENTRY_DEFAULTS.QUANTITY}
              className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label>{PRODUCT_STOCK_ENTRY_COPY.IMPORT_PRICE_LABEL}</label>
            <input
              type="number"
              name={PRODUCT_STOCK_ENTRY_FORM_FIELDS.IMPORT_PRICE}
              required
              min={PRODUCT_STOCK_ENTRY_DEFAULTS.MIN_IMPORT_PRICE}
              placeholder={PRODUCT_STOCK_ENTRY_COPY.IMPORT_PRICE_PLACEHOLDER}
              className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label>{PRODUCT_STOCK_ENTRY_COPY.NOTES_LABEL}</label>
          <textarea
            name={PRODUCT_STOCK_ENTRY_FORM_FIELDS.NOTES}
            placeholder={PRODUCT_STOCK_ENTRY_COPY.NOTES_PLACEHOLDER}
            style={{ resize: "none" }}
            className="border border-slate-300 h-16 p-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
          />
        </div>

        <button
          type="submit"
          className="bg-kv-blue-primary text-white h-9 rounded-lg font-bold hover:bg-kv-blue-dark transition-all shadow-sm mt-2"
        >
          {PRODUCT_STOCK_ENTRY_COPY.SUBMIT_ACTION}
        </button>
      </form>
    )}
  </div>
);
