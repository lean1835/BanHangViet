import React from "react";
import { useAppSelector } from "@/hooks/useRedux";
import { DEFAULT_BUSINESS_INFO, SETTINGS_UI } from "@/constants/settings";

export const BusinessInfoPanel: React.FC = () => {
  const household = useAppSelector((state) => state.auth.user?.household);

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
          {SETTINGS_UI.BUSINESS_INFO.TITLE}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-medium text-xs">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.NAME}
              </span>
              <span className="text-sm font-bold text-slate-900 border-b pb-1.5 mt-1">
                {household?.name || DEFAULT_BUSINESS_INFO.NAME}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-medium text-xs">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.TAX_CODE}
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono tracking-wider border-b pb-1.5 mt-1">
                {household?.taxCode || DEFAULT_BUSINESS_INFO.TAX_CODE}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-medium text-xs">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.PHONE}
              </span>
              <span className="text-sm font-bold text-slate-900 border-b pb-1.5 mt-1">
                {household?.phoneNumber || DEFAULT_BUSINESS_INFO.PHONE_NUMBER}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-medium text-xs">
                {SETTINGS_UI.BUSINESS_INFO.LABELS.ADDRESS}
              </span>
              <span className="text-sm font-bold text-slate-900 border-b pb-1.5 mt-1">
                {household?.address || DEFAULT_BUSINESS_INFO.ADDRESS}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-xs">
          <span className="text-base">{SETTINGS_UI.BUSINESS_INFO.NOTICE_ICON}</span>
          <span className="font-semibold leading-relaxed">
            {SETTINGS_UI.BUSINESS_INFO.NOTICE}
          </span>
        </div>
      </div>
    </div>
  );
};
