import React from "react";
import { HelpCircle } from "lucide-react";
import { useScreenGuide } from "../context/ScreenGuideContext";

interface ScreenGuideTriggerButtonProps {
  variant?: "header" | "floating" | "compact";
  className?: string;
  targetScreenCode?: string;
}

export const ScreenGuideTriggerButton: React.FC<ScreenGuideTriggerButtonProps> = ({
  variant = "header",
  className = "",
  targetScreenCode,
}) => {
  const { openGuide } = useScreenGuide();

  const handleClick = () => {
    openGuide(targetScreenCode);
  };

  if (variant === "floating") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 active:scale-95 transition-all cursor-pointer ring-4 ring-white/70 hover:shadow-2xl ${className}`}
        title="Bấm để xem hướng dẫn ngắn tại chỗ cho màn hình này"
        aria-label="Mở hướng dẫn sử dụng màn hình"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer ${className}`}
        title="Xem hướng dẫn thao tác màn hình này"
        aria-label="Xem hướng dẫn"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Hướng dẫn</span>
      </button>
    );
  }

  // Variant "header": Nút trên Header Bar (cạnh NotificationCenterDropdown)
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 font-bold text-white hover:bg-white/20 active:scale-95 transition-all text-xs whitespace-nowrap cursor-pointer select-none shadow-xs ${className}`}
      title="Xem hướng dẫn ngắn tại chỗ"
      aria-label="Mở hướng dẫn màn hình"
    >
      <HelpCircle className="h-4 w-4 text-blue-200" />
      <span className="hidden md:inline">Trợ giúp</span>
    </button>
  );
};
