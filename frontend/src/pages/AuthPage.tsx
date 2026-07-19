import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { APP_BRAND } from "@/constants/app";
import { AUTH_TABS, AUTH_UI } from "@/constants/auth";

export const AuthPage: React.FC = () => {
  const location = useLocation();

  const getTabClassName = (isActive: boolean) =>
    `flex-1 py-3.5 text-center font-bold text-xs uppercase tracking-wider border-b-2 transition-all duration-150 ${
      isActive
        ? "text-kv-blue-primary border-b-kv-blue-primary bg-white"
        : "text-slate-400 border-b-transparent hover:text-slate-600"
    }`;

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1e3c72] to-[#2a5298] z-[10000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-[920px] min-h-[550px] rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[1.15fr_1fr] animate-auth-fade-in">
        
        {/* Left: Product Introduction & Animations */}
        <div className="bg-gradient-to-br from-[#070e27] to-[#0050df] text-white p-8 flex flex-col justify-between relative overflow-hidden hidden md:flex border-r border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                className="text-[#60A5FA]"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-extrabold text-xl tracking-wide">
                {APP_BRAND.PREFIX}
                <span className="text-[#60A5FA] ml-0.5">
                  {APP_BRAND.SUFFIX}
                </span>
              </span>
            </div>
            
            <h2 className="text-xl font-extrabold leading-snug mb-3">
              {AUTH_UI.INTRO_TITLE}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {AUTH_UI.INTRO_DESCRIPTION}
            </p>
          </div>

          {/* Cloud Connection Animated Graphic */}
          <div className="relative h-[180px] my-6 bg-white/[0.03] rounded-xl border border-white/[0.08] overflow-hidden">
            {/* Cloud Server Node (Tax) */}
            <div className="absolute right-[15%] top-[22%] text-center z-10">
              <div className="w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
                <svg width="20" height="20" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-.1-9.999 5.002 5.002 0 1 0-9.78 2.096A4.001 4.001 0 0 0 3 15z"
                  />
                </svg>
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">
                {AUTH_UI.TAX_AUTHORITY_LABEL}
              </span>
            </div>

            {/* App Client Node (POS) */}
            <div className="absolute left-[15%] top-[48%] text-center z-10">
              <div className="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                <svg width="20" height="20" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
                  />
                </svg>
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">
                {AUTH_UI.POS_LABEL}
              </span>
            </div>

            {/* Animated Data Packet */}
            <div className="absolute w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_#f59e0b] animate-float-packet z-[5]"></div>
            <div className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981] animate-float-packet-reverse z-[5]"></div>

            {/* Connection Line */}
            <svg className="absolute w-full h-full top-0 left-0 pointer-events-none z-0">
              <line
                x1="25%"
                y1="60%"
                x2="80%"
                y2="35%"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2"
                strokeDasharray="4"
              />
            </svg>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" className="text-emerald-500">
              <path
                fillRule="evenodd"
                d="M2.166 4.9L10 1.154l7.834 3.746A2 2 0 0119 6.74v4.997a4 4 0 01-2.166 3.59L10 18.846l-6.834-3.52A4 4 0 011 11.737V6.74a2 2 0 011.166-1.84zM10 3.3L4 6.177v5.56c0 1.02.467 1.982 1.272 2.6L10 16.92l4.728-2.583A3 3 0 0016 11.737v-5.56L10 3.3z"
                clipRule="evenodd"
              />
            </svg>
            <span>{AUTH_UI.SECURITY_LABEL}</span>
          </div>
        </div>

        {/* Right: Auth Forms */}
        <div className="flex flex-col justify-between bg-white">
          
          <div className="bg-slate-50 border-b border-slate-100 py-5 px-6 text-center flex flex-col items-center gap-1.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 text-kv-blue-primary"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span className="font-extrabold text-lg text-kv-blue-primary tracking-wide">
              {APP_BRAND.PREFIX}
              <strong className="text-gray-800 font-extrabold">
                {APP_BRAND.SUFFIX}
              </strong>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {APP_BRAND.SYSTEM_DESCRIPTION}
            </span>
          </div>

          <div className="flex border-b border-slate-100 bg-slate-50">
            {AUTH_TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) => getTabClassName(isActive)}
              >
                {tab.label}
              </NavLink>
            ))}
          </div>

          <div
            key={location.pathname}
            className="p-6 flex-1 flex flex-col justify-center"
          >
            <Outlet />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
