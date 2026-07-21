import React from "react";
import { TAX_AUTHORITY_COPY } from "@/constants/taxAuthority";

export const TaxAuthorityHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold text-slate-800">
          {TAX_AUTHORITY_COPY.HEADER_TITLE}
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          {TAX_AUTHORITY_COPY.HEADER_DESCRIPTION}
        </p>
      </div>
      <div className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600">
        {TAX_AUTHORITY_COPY.ROLE_BADGE}
      </div>
    </div>
  );
};

export default TaxAuthorityHeader;
