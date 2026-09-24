import React, { useEffect, useState, useRef } from "react";
import { useScreenGuide } from "../context/ScreenGuideContext";
import { useCurrentScreenGuide } from "../hooks/useCurrentScreenGuide";
import { Sparkles } from "lucide-react";

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const ScreenGuideHighlightOverlay: React.FC = () => {
  const { isOpen, isHighlightEnabled, currentStepIndex } = useScreenGuide();
  const { guide } = useCurrentScreenGuide();
  const [rect, setRect] = useState<ElementRect | null>(null);
  const targetSelector = guide?.steps?.[currentStepIndex]?.targetElementSelector;
  const buttonLabel = guide?.steps?.[currentStepIndex]?.buttonLabel;
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!isOpen || !isHighlightEnabled || !targetSelector) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      try {
        const el = document.querySelector(targetSelector);
        if (el) {
          const r = el.getBoundingClientRect();
          // Chỉ set rect nếu phần tử hiển thị có kích thước
          if (r.width > 0 && r.height > 0) {
            setRect({
              top: r.top + window.scrollY,
              left: r.left + window.scrollX,
              width: r.width,
              height: r.height,
            });
            return;
          }
        }
        setRect(null);
      } catch (err) {
        console.warn("Invalid targetElementSelector:", targetSelector, err);
        setRect(null);
      }
    };

    // Tự động cuộn phần tử vào giữa tầm nhìn
    const scrollTargetIntoView = () => {
      try {
        const el = document.querySelector(targetSelector);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
      } catch {
        // ignore selector syntax errors
      }
    };

    // Gọi lần đầu và sau timeout nhẹ để đợi render DOM
    scrollTargetIntoView();
    const timer = setTimeout(updateRect, 150);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    const currentObserver = observerRef.current;
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      currentObserver?.disconnect();
    };
  }, [isOpen, isHighlightEnabled, targetSelector, currentStepIndex]);

  if (!isOpen || !isHighlightEnabled || !rect) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-40 transition-all duration-300 ease-out"
      style={{
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      }}
      aria-hidden="true"
    >
      {/* Vòng sáng viền động phát quang (Glowing Pulse Ring) */}
      <div className="absolute inset-0 rounded-xl border-4 border-amber-500 bg-amber-400/10 shadow-[0_0_25px_rgba(245,158,11,0.65)] animate-pulse" />

      {/* Badge nhãn chỉ vị trí nổi bật cho người lớn tuổi */}
      <div className="absolute -top-8 left-0 flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-0.5 text-xs font-black text-white shadow-md animate-bounce whitespace-nowrap">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-200" />
        <span>Vị trí thao tác: {buttonLabel || "Bấm tại đây"}</span>
      </div>
    </div>
  );
};
