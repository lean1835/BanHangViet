import React from "react";
import {
  TAX_AUTHORITY_UI,
  TAX_RECEIVING_OPTIONS,
} from "@/constants/taxAuthority";

export const TaxReceivingConfigPage: React.FC = () => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-2">
        {TAX_AUTHORITY_UI.RECEIVING_CONFIG_TITLE}
      </h3>
      <div className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
        {TAX_RECEIVING_OPTIONS.map((option) => (
          <div key={option.id} className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id={option.id}
              defaultChecked={option.defaultChecked}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <label htmlFor={option.id} className="cursor-pointer font-bold">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaxReceivingConfigPage;
