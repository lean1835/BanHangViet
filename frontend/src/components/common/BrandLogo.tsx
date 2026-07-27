import React from "react";

export type TBrandLogoVariant = "default" | "light" | "dark" | "rainbow";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: TBrandLogoVariant;
  textColorClass?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  variant = "default",
  textColorClass,
  className = "",
}) => {
  const sizeClasses = {
    sm: {
      text: "text-xs",
      badge: "text-xs px-1.5 py-0.5 ml-1",
    },
    md: {
      text: "text-sm sm:text-base",
      badge: "text-sm sm:text-base px-2 py-0.5 ml-1.5",
    },
    lg: {
      text: "text-lg sm:text-xl",
      badge: "text-lg sm:text-xl px-2.5 py-0.5 ml-2",
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

  return (
    <div className={`flex items-center select-none group cursor-pointer ${className}`}>
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
