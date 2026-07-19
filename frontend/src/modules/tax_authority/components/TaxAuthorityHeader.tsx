import React from "react";
import { TAX_AUTHORITY_COPY } from "@/constants/taxAuthority";

export const TaxAuthorityHeader: React.FC = () => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <h2 className="text-lg font-extrabold text-slate-800">
          {TAX_AUTHORITY_COPY.HEADER_TITLE}
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          {TAX_AUTHORITY_COPY.HEADER_DESCRIPTION}
        </p>
      </div>
      <div className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200">
        {TAX_AUTHORITY_COPY.ROLE_BADGE}
      </div>
    </div>
  );
};

export default TaxAuthorityHeader;
