import {
  DEFAULT_ORDER_SIDEBAR_STATUSES,
  ORDER_SIDEBAR_STATUS_OPTIONS,
  ORDER_UI,
} from "@/constants/order";

export const OrderSidebar = () => (
  <>
    <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
      {ORDER_UI.SIDEBAR.TITLE}
    </div>
    <div className="flex flex-col gap-3">
      <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
        {ORDER_UI.SIDEBAR.STATUS_FILTER_LABEL}
      </span>
      <div className="flex flex-col gap-2 font-medium text-slate-700">
        {ORDER_SIDEBAR_STATUS_OPTIONS.map((status) => (
          <label key={status} className="flex min-h-11 cursor-pointer items-center gap-2 lg:min-h-0">
            <input
              type="checkbox"
              defaultChecked={DEFAULT_ORDER_SIDEBAR_STATUSES.includes(status)}
              className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
            />
            <span>{status}</span>
          </label>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
        {ORDER_UI.SIDEBAR.DELIVERY_TIME_FILTER_LABEL}
      </span>
      <div className="flex flex-col gap-2 font-medium text-slate-600">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 lg:min-h-0">
          <input
            type="radio"
            name={ORDER_UI.SIDEBAR.TIME_FILTER_NAME}
            defaultChecked
            className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
          />
          <span>{ORDER_UI.SIDEBAR.ALL_TIME_LABEL}</span>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 lg:min-h-0">
          <input
            type="radio"
            name={ORDER_UI.SIDEBAR.TIME_FILTER_NAME}
            className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
          />
          <span>{ORDER_UI.SIDEBAR.CUSTOM_TIME_LABEL}</span>
        </label>
      </div>
    </div>
  </>
);
