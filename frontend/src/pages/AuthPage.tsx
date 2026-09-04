import React, { useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ShoppingCart, Package, Receipt } from "lucide-react";

export interface AuthOutletContext {
  triggerDoorOpening: () => Promise<void>;
  isDoorOpening: boolean;
}

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const [isDoorOpening, setIsDoorOpening] = useState(false);

  const triggerDoorOpening = useCallback((): Promise<void> => {
    setIsDoorOpening(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 750);
    });
  }, []);

  return (
    <div className="h-screen max-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50/60 to-white select-none">

      {/* 🚪 The Two Massive Sliding Doors in Foreground (z-10) */}
      <div className="absolute inset-0 z-10 flex flex-col lg:flex-row pointer-events-auto">
        {/* Left Door: Blue Hero Banner (Pulls 100% to the LEFT) */}
        <div
          className={`relative hidden lg:flex flex-col justify-between w-[50%] xl:w-[52%] h-screen max-h-screen bg-gradient-to-br from-[#0F56E8] via-[#0E50DE] to-[#0A3CB3] text-white p-10 xl:p-14 overflow-hidden flex-shrink-0 door-slide-left ${
            isDoorOpening ? "-translate-x-full shadow-[30px_0_60px_rgba(0,0,0,0.5)]" : "translate-x-0"
          }`}
        >
          {/* Decorative Top-Left Dot Matrix */}
          <div className="absolute top-8 left-8 grid grid-cols-6 gap-2.5 opacity-25 pointer-events-none">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
            ))}
          </div>

          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          <div className="z-10" />

          <div className="my-auto text-center flex flex-col items-center z-10 max-w-md mx-auto">
            <div className="w-28 h-28 mb-5 flex items-center justify-center transform transition-transform hover:scale-105 duration-300">
              <img
                src="/app-logo.png"
                alt="Bán Hàng Việt Logo"
                className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)] select-none pointer-events-none"
              />
            </div>
            <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-white">
              Bán Hàng Việt
            </h1>
            <p className="text-sm xl:text-base text-blue-100/90 mt-3 leading-relaxed font-normal">
              Giải pháp quản lý bán hàng đa kênh &amp; hóa đơn điện tử thông minh, tinh gọn và hiệu quả toàn diện.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-5 pb-1 border-t border-white/10 z-10 max-w-md mx-auto w-full">
            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:scale-105 group-hover:bg-white/20 shadow-sm">
                <ShoppingCart className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold text-white/95 leading-tight">Bán hàng POS</span>
              <span className="text-[10px] text-blue-100/70 mt-0.5 leading-tight">Tính tiền &amp; quét mã</span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:scale-105 group-hover:bg-white/20 shadow-sm">
                <Package className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold text-white/95 leading-tight">Quản lý kho</span>
              <span className="text-[10px] text-blue-100/70 mt-0.5 leading-tight">Tồn kho tức thời</span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:scale-105 group-hover:bg-white/20 shadow-sm">
                <Receipt className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold text-white/95 leading-tight">Hóa đơn điện tử</span>
              <span className="text-[10px] text-blue-100/70 mt-0.5 leading-tight">Chuẩn Tổng cục Thuế</span>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-56 xl:h-64 z-0">
            <div className="absolute bottom-0 left-0 w-[200%] h-full animate-wave-back">
              <svg viewBox="0 0 2880 320" preserveAspectRatio="none" className="w-full h-full opacity-35">
                <path fill="#031C57" d="M 0,180 Q 360,250 720,180 T 1440,180 Q 2160,250 2880,180 L 2880,320 L 0,320 Z" />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] h-full animate-wave-mid">
              <svg viewBox="0 0 2880 320" preserveAspectRatio="none" className="w-full h-full opacity-30">
                <path fill="#2563EB" d="M 0,145 Q 360,80 720,145 T 1440,145 Q 2160,80 2880,145 L 2880,320 L 0,320 Z" />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] h-full animate-wave-front">
              <svg viewBox="0 0 2880 320" preserveAspectRatio="none" className="w-full h-full opacity-20">
                <path fill="#FFFFFF" d="M 0,190 Q 360,130 720,190 T 1440,190 Q 2160,130 2880,190 L 2880,320 L 0,320 Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Door: Form Area (Pulls 100% to the RIGHT) */}
        <div
          className={`flex-1 h-screen max-h-screen bg-[#F6F8FB] flex flex-col justify-center items-center p-4 sm:p-8 relative overflow-y-auto door-slide-right ${
            isDoorOpening ? "translate-x-full shadow-[-30px_0_60px_rgba(0,0,0,0.3)]" : "translate-x-0"
          }`}
        >
          <div className="lg:hidden w-full max-w-[440px] mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/70 text-blue-700 text-xs font-semibold mb-2">
              <span>✨ Bán Hàng Việt</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Hệ thống Quản lý Bán hàng</h2>
          </div>

          <div
            key={location.pathname}
            className="w-full flex justify-center items-center my-auto animate-card-reveal"
          >
            <Outlet context={{ triggerDoorOpening, isDoorOpening } satisfies AuthOutletContext} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

