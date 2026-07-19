import React from "react";
import { SETTINGS_UI, TAX_RATE_STATUS } from "@/constants/settings";
import { MOCK_TAX_RATES } from "@/constants/mockData/settings";

export const TaxRateSettings: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-2">
          {SETTINGS_UI.TAX_RATE.TITLE}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="p-3">{SETTINGS_UI.TAX_RATE.COLUMNS.CODE}</th>
                <th className="p-3">{SETTINGS_UI.TAX_RATE.COLUMNS.DESCRIPTION}</th>
                <th className="p-3 text-right">
                  {SETTINGS_UI.TAX_RATE.COLUMNS.VAT_RATE}
                </th>
                <th className="p-3 text-right">
                  {SETTINGS_UI.TAX_RATE.COLUMNS.PERSONAL_INCOME_TAX_RATE}
                </th>
                <th className="p-3 text-center">
                  {SETTINGS_UI.TAX_RATE.COLUMNS.STATUS}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {MOCK_TAX_RATES.map((taxRate) => (
                <tr key={taxRate.code}>
                  <td className="p-3 font-mono font-bold text-slate-600">
                    {taxRate.code}
                  </td>
                  <td className="p-3 font-bold text-slate-800">
                    {taxRate.description}
                  </td>
                  <td className="p-3 text-right font-bold text-kv-blue-primary">
                    {taxRate.vatRateLabel}
                  </td>
                  <td className="p-3 text-right font-bold text-indigo-600">
                    {taxRate.personalIncomeTaxRateLabel}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={
                        taxRate.status === TAX_RATE_STATUS.DEFAULT
                          ? "bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]"
                          : "bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px]"
                      }
                    >
                      {taxRate.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
