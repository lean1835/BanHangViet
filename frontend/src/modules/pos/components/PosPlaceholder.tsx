import { POS_COPY } from "@/constants/pos";

export const PosPlaceholder = () => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 animate-auth-fade-in">
    <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3">
      {POS_COPY.PAGE_TITLE}
    </h3>
    <div className="min-h-[300px] flex flex-col items-center justify-center text-center text-slate-400 gap-3">
      <span className="text-4xl">{POS_COPY.ICON}</span>
      <span className="font-bold text-slate-600">{POS_COPY.OPENING_MESSAGE}</span>
      <span className="text-[11px] font-semibold">
        {POS_COPY.DESCRIPTION}
      </span>
    </div>
  </div>
);
