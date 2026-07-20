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
            className="rounded bg-slate-100 px-2 py-1 font-bold text-slate-700"
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
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-slate-700 lg:min-h-0">
          <input
            type="radio"
            name={SHIFT_UI.SIDEBAR.TIME_FILTER_NAME}
            defaultChecked
            className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
          />
          <span>{SHIFT_UI.SIDEBAR.CURRENT_MONTH_LABEL}</span>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-slate-600 lg:min-h-0">
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
