import React, { useState, useRef, useEffect } from "react";
import { Store, ChevronDown, Check, Building2, Calendar, ShieldCheck } from "lucide-react";
import {
  useGetAuthorizedHouseholdsQuery,
  useSwitchHouseholdMutation,
} from "@/modules/employee/services/accountantInvitationApi";
import { ACCESS_SCOPE_LABELS } from "@/modules/employee/types/IAccountantInvitation";
import { useNotification } from "@/hooks/useNotification";

export const HouseholdSwitcher: React.FC = () => {
  const { data: households = [], isLoading } =
    useGetAuthorizedHouseholdsQuery();
  const [switchHousehold, { isLoading: isSwitching }] =
    useSwitchHouseholdMutation();
  const { showSuccess } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentHousehold =
    households.find((h) => h.isCurrent) || households[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (householdId: string) => {
    if (householdId === currentHousehold?.id) {
      setIsOpen(false);
      return;
    }

    try {
      await switchHousehold(householdId).unwrap();
      const target = households.find((h) => h.id === householdId);
      showSuccess(`Đã chuyển làm việc sang: ${target?.name}`);
      setIsOpen(false);
    } catch {
      // Handled
    }
  };

  if (isLoading || !currentHousehold) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg text-white text-xs">
        <Store size={14} className="animate-spin" />
        <span>Đang tải hộ...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer shadow-xs"
        title="Chuyển hộ kinh doanh đang làm việc"
      >
        <div className="p-1 rounded bg-amber-400 text-slate-900">
          <Store size={13} />
        </div>
        <div className="text-left flex flex-col min-w-0 max-w-[150px] sm:max-w-[200px]">
          <span className="text-[9px] text-blue-100 uppercase tracking-wider font-semibold truncate">
            Hộ đang làm việc:
          </span>
          <span className="truncate leading-tight font-extrabold text-[11px]">
            {currentHousehold.name}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-blue-100 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 text-xs animate-fade-in">
          <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Danh sách hộ được ủy quyền
            </span>
            <span className="px-1.5 py-0.5 bg-blue-50 text-kv-blue-primary rounded text-[10px] font-bold">
              {households.length} hộ
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 py-1">
            {households.map((h) => {
              const isSelected = h.id === currentHousehold.id;
              return (
                <div
                  key={h.id}
                  onClick={() => handleSelect(h.id)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? "bg-blue-50/70 text-kv-blue-primary"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      isSelected
                        ? "bg-kv-blue-primary text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Building2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 truncate">
                        {h.name}
                      </span>
                      {isSelected && (
                        <span className="p-0.5 rounded-full bg-blue-500 text-white shrink-0">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      MST: {h.taxCode}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      <Calendar size={11} />
                      <span>Hạn: {h.expiryDate}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {h.scopes.map((s) => (
                        <span
                          key={s}
                          className="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-medium"
                        >
                          {ACCESS_SCOPE_LABELS[s]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Dữ liệu hóa đơn và sổ sách hoàn toàn cách ly giữa các hộ</span>
          </div>
        </div>
      )}
    </div>
  );
};
