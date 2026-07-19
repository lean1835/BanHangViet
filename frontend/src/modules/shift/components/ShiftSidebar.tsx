import { SHIFT_SIDEBAR_STATUS_OPTIONS, SHIFT_UI } from "@/constants/shift";

export const ShiftSidebar = () => (
  <>
    <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
      {SHIFT_UI.SIDEBAR.TITLE}
    </div>
    <div className="flex flex-col gap-3">
      <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
        {SHIFT_UI.SIDEBAR.STATUS_FILTER_LABEL}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {SHIFT_SIDEBAR_STATUS_OPTIONS.map((status) => (
          <span
            key={status}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer transition-colors"
          >
            {status}
          </span>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
        {SHIFT_UI.SIDEBAR.TIME_FILTER_LABEL}
      </span>
      <div className="flex flex-col gap-2 font-medium">
        <label className="flex items-center gap-2 cursor-pointer text-slate-700">
          <input
            type="radio"
            name={SHIFT_UI.SIDEBAR.TIME_FILTER_NAME}
            defaultChecked
            className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
          />
          <span>{SHIFT_UI.SIDEBAR.CURRENT_MONTH_LABEL}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-600">
          <input
            type="radio"
            name={SHIFT_UI.SIDEBAR.TIME_FILTER_NAME}
            className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
          />
          <span>{SHIFT_UI.SIDEBAR.CUSTOM_TIME_LABEL}</span>
        </label>
      </div>
    </div>
  </>
);
