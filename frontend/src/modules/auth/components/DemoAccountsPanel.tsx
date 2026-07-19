import React, { useState } from "react";
import { AUTH_ENVIRONMENT, AUTH_UI } from "@/constants/auth";
import { DEMO_ACCOUNTS } from "@/constants/demoAccounts";
import type { IDemoAccount } from "@/constants/demoAccounts";

interface DemoAccountsPanelProps {
  /** Callback khi người dùng click vào một tài khoản demo để điền vào form */
  onSelect: (username: string, password: string) => void;
}

/**
 * Panel hiển thị danh sách tài khoản demo để kiểm thử nhanh.
 * Chỉ render trong môi trường phát triển (non-production).
 */
export const DemoAccountsPanel: React.FC<DemoAccountsPanelProps> = ({
  onSelect,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Không hiển thị ở môi trường production
  if (import.meta.env.VITE_APP_ENV === AUTH_ENVIRONMENT.PRODUCTION) {
    return null;
  }

  return (
    <div className="border border-dashed border-blue-300 rounded-lg overflow-hidden mt-1">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-3.5 h-3.5 text-blue-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.7c-.29.37-.452.83-.452 1.3V18h-4v-1.1c0-.47-.162-.93-.452-1.3l-.548-.7z"
            />
          </svg>
          <span className="text-xs font-bold text-blue-700">
            {AUTH_UI.DEMO_ACCOUNTS.HEADER}
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-blue-500 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Account list */}
      {expanded && (
        <div className="p-2 bg-white flex flex-col gap-1.5">
          {DEMO_ACCOUNTS.map((account: IDemoAccount) => (
            <button
              key={account.roleId}
              type="button"
              onClick={() => onSelect(account.username, account.password)}
              className="flex items-start gap-2.5 w-full text-left px-2.5 py-2 rounded-md border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              {/* Role badge */}
              <span
                className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${account.badgeColor} mt-0.5`}
              >
                {account.roleId}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-800 truncate">
                    {account.roleName}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0 group-hover:text-blue-600 transition-colors">
                    {account.username}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed line-clamp-1">
                  {account.description}
                </p>
              </div>
            </button>
          ))}
          <p className="text-[10px] text-gray-400 text-center mt-1">
            {AUTH_UI.DEMO_ACCOUNTS.SELECT_HINT}
          </p>
        </div>
      )}
    </div>
  );
};
