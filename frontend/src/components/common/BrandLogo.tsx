import React from "react";

export type TBrandLogoVariant = "default" | "light" | "dark" | "rainbow";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: TBrandLogoVariant;
  textColorClass?: string;
  className?: string;
  showIcon?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  variant = "default",
  textColorClass,
  className = "",
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: {
      text: "text-xs sm:text-sm",
      badge: "text-[11px] px-1.5 py-0.5 ml-1",
      icon: "w-7 h-7 sm:w-8 sm:h-8",
    },
    md: {
      text: "text-sm sm:text-base",
      badge: "text-xs sm:text-sm px-2 py-0.5 ml-1.5",
      icon: "w-9 h-9 sm:w-10 sm:h-10",
    },
    lg: {
      text: "text-xl sm:text-2xl",
      badge: "text-sm sm:text-base px-2.5 py-0.5 ml-2",
      icon: "w-12 h-12 sm:w-14 sm:h-14",
    },
    xl: {
      text: "text-2xl sm:text-3xl",
      badge: "text-base sm:text-lg px-3.5 py-1 ml-3",
      icon: "w-16 h-16 sm:w-20 sm:h-20",
    },
  };

  const variantGradients: Record<TBrandLogoVariant, string> = {
    default: "from-blue-700 via-sky-500 to-indigo-600",
    light: "from-white via-sky-200 to-blue-100",
    dark: "from-slate-900 via-blue-950 to-indigo-900",
    rainbow: "from-blue-600 via-emerald-500 via-purple-600 to-pink-500",
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const gradientClass = textColorClass || `bg-gradient-to-r ${variantGradients[variant]} bg-clip-text text-transparent`;

  // Tailored drop-shadow depending on background contrast
  const shadowFilterClass =
    variant === "light"
      ? "drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] group-hover:drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
      : "drop-shadow-[0_3px_5px_rgba(0,0,0,0.2)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] group-hover:drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]";

  return (
    <div className={`flex items-center select-none group cursor-pointer ${className}`}>
      {showIcon && (
        <img
          src="/app-logo.png"
          alt="Logo Bán Hàng Việt"
          className={`${currentSize.icon} mr-2 object-contain filter ${shadowFilterClass} transition-all duration-300 group-hover:scale-110 shrink-0`}
        />
      )}
      <span
        className={`${currentSize.text} font-black tracking-tight ${gradientClass} animate-logo-text-glow drop-shadow-sm leading-none`}
      >
        BÁN HÀNG
      </span>
      <span
        className={`relative overflow-hidden rounded-md bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/30 transition-transform duration-300 group-hover:scale-105 leading-none ${currentSize.badge}`}
      >
        <span className="relative z-10">VIỆT</span>
        <span className="absolute inset-0 -translate-x-full animate-logo-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </span>
    </div>
  );
};

export default BrandLogo;
