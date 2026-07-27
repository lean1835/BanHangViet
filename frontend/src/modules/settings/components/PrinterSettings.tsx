import React from "react";
import {
  PRINTER_DEFAULTS,
  PRINTER_DEVICE_OPTIONS,
  PRINTER_MESSAGES,
  PRINTER_PAPER_SIZE_OPTIONS,
  SETTINGS_ELEMENT_IDS,
  SETTINGS_UI,
} from "@/constants/settings";
import { useNotification } from "@/hooks/useNotification";

export const PrinterSettings: React.FC = () => {
  const { showInfo } = useNotification();
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
          {SETTINGS_UI.PRINTER.TITLE}
        </h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            showInfo(PRINTER_MESSAGES.SAVE_UNAVAILABLE);
          }}
          className="flex flex-col gap-4 font-semibold text-slate-700 max-w-md"
        >
          <div className="flex flex-col gap-1">
            <label>{SETTINGS_UI.PRINTER.DEVICE_LABEL}</label>
            <select className="border border-slate-300 h-9 px-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs bg-white font-bold">
              {PRINTER_DEVICE_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label>{SETTINGS_UI.PRINTER.PAPER_SIZE_LABEL}</label>
              <select className="border border-slate-300 h-9 px-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs bg-white font-bold">
                {PRINTER_PAPER_SIZE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label>{SETTINGS_UI.PRINTER.COPY_COUNT_LABEL}</label>
              <input
                type="number"
                defaultValue={PRINTER_DEFAULTS.COPY_COUNT}
                min={PRINTER_DEFAULTS.MIN_COPY_COUNT}
                className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold"
              />
            </div>
          </div>

          <label
            htmlFor={SETTINGS_ELEMENT_IDS.AUTO_PRINT}
            className="flex min-h-11 cursor-pointer items-center gap-2 py-1 lg:min-h-0"
          >
            <input
              type="checkbox"
              id={SETTINGS_ELEMENT_IDS.AUTO_PRINT}
              defaultChecked={PRINTER_DEFAULTS.AUTO_PRINT}
              className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
            />
            <span className="font-bold">
              {SETTINGS_UI.PRINTER.AUTO_PRINT_LABEL}
            </span>
          </label>

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-4 h-9 rounded-lg transition-colors"
            >
              {SETTINGS_UI.PRINTER.SAVE_ACTION}
            </button>
            <button
              type="button"
              onClick={() => showInfo(PRINTER_MESSAGES.TEST_UNAVAILABLE)}
              className="bg-slate-200 hover:bg-slate-300 font-bold px-4 h-9 rounded-lg transition-colors"
            >
              {SETTINGS_UI.PRINTER.TEST_ACTION}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
