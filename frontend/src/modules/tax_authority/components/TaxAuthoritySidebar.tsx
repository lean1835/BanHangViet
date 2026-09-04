import React from "react";
import { NavLink, useNavigate, type NavLinkRenderProps } from "react-router-dom";
import { LogOut } from "lucide-react";
import {
  TAX_AUTHORITY_COPY,
  TAX_AUTHORITY_NAV_ITEMS,
} from "@/constants/taxAuthority";
import { useAppDispatch } from "@/hooks/useRedux";
import { logout } from "@/stores/authSlice";
import { baseApi } from "@/stores/baseApi";
import { APP_ROUTES } from "@/constants/routes";

const getNavLinkClassName = ({ isActive }: NavLinkRenderProps): string =>
  `flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-xs font-bold transition-all lg:min-h-0 ${
    isActive
      ? "bg-kv-blue-light text-kv-blue-primary"
      : "hover:bg-slate-50 text-slate-600"
  }`;

export const TaxAuthoritySidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(baseApi.util.resetApiState());
    dispatch(logout());
    navigate(APP_ROUTES.LOGIN);
  };

  return (
    <div className="flex flex-col flex-1 justify-between h-full min-h-[300px]">
      <div className="flex flex-col gap-3">
        <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
          {TAX_AUTHORITY_COPY.SIDEBAR_TITLE}
        </div>
        <div className="flex flex-col gap-1">
          {TAX_AUTHORITY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={getNavLinkClassName}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-auto border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold text-xs p-2.5 rounded-xl transition-all cursor-pointer"
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default TaxAuthoritySidebar;
