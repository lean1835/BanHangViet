import React from "react";
import type { FormEventHandler } from "react";
import {
  CUSTOMER_FORM_DEFAULTS,
  CUSTOMER_FORM_FIELDS,
  CUSTOMER_UI,
} from "@/constants/customer";

interface CustomerFormProps {
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onSubmit }) => {
  return (
    <div className="xl:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-4">
        {CUSTOMER_UI.FORM.TITLE}
      </h3>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 font-semibold text-slate-700">
        <div className="flex flex-col gap-1">
          <label>{CUSTOMER_UI.FORM.LABELS.NAME}</label>
          <input
            type="text"
            name={CUSTOMER_FORM_FIELDS.NAME}
            required
            placeholder={CUSTOMER_UI.FORM.PLACEHOLDERS.NAME}
            className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label>{CUSTOMER_UI.FORM.LABELS.PHONE}</label>
          <input
            type="text"
            name={CUSTOMER_FORM_FIELDS.PHONE}
            required
            placeholder={CUSTOMER_UI.FORM.PLACEHOLDERS.PHONE}
            className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label>{CUSTOMER_UI.FORM.LABELS.EMAIL}</label>
          <input
            type="email"
            name={CUSTOMER_FORM_FIELDS.EMAIL}
            placeholder={CUSTOMER_UI.FORM.PLACEHOLDERS.EMAIL}
            className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label>{CUSTOMER_UI.FORM.LABELS.CREDIT_LIMIT}</label>
          <input
            type="number"
            name={CUSTOMER_FORM_FIELDS.CREDIT_LIMIT}
            required
            defaultValue={CUSTOMER_FORM_DEFAULTS.CREDIT_LIMIT}
            className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold"
          />
        </div>

        <button
          type="submit"
          className="bg-kv-blue-primary text-white h-9 rounded-lg font-bold hover:bg-kv-blue-dark transition-all shadow-sm mt-2"
        >
          {CUSTOMER_UI.FORM.SUBMIT}
        </button>
      </form>
    </div>
  );
};
