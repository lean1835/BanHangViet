import { useEffect, useRef } from "react";

interface IUseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minBarcodeLength?: number;
  maxIntervalMs?: number;
}

// Mã vạch chỉ chứa các ký tự ASCII chuẩn: chữ cái, số, gạch ngang, gạch dưới, chấm, gạch chéo
const VALID_BARCODE_CHAR_REGEX = /^[a-zA-Z0-9\-_./]$/;
const VALID_BARCODE_STRING_REGEX = /^[a-zA-Z0-9\-_./]{4,}$/;

/**
 * Custom hook to detect USB/Bluetooth barcode scanner HID keystroke events.
 * Barcode scanners type characters extremely fast (<35ms per character) followed by "Enter".
 */
export const useBarcodeScanner = ({
  onScan,
  enabled = true,
  minBarcodeLength = 4,
  maxIntervalMs = 40,
}: IUseBarcodeScannerOptions): void => {
  const bufferRef = useRef<string[]>([]);
  const lastTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  // Keep latest onScan callback reference
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Bỏ qua các sự kiện bộ gõ tiếng Việt (Telex/VNI - UniKey, EVKey, Windows IME)
      if (e.isComposing || e.key === "Process" || e.keyCode === 229) {
        bufferRef.current = [];
        return;
      }

      // 2. Bỏ qua các phím bổ trợ và phím điều hướng/chức năng
      if (
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key === "CapsLock" ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key.startsWith("Arrow") ||
        e.key.startsWith("F")
      ) {
        if (e.key === "Escape" || e.key === "Backspace") {
          bufferRef.current = [];
        }
        return;
      }

      // 3. TUYỆT ĐỐI KHÔNG can thiệp nếu người dùng đang nhập liệu trong Chatbot, Textarea hoặc Modal/Dialog
      const target = e.target as HTMLElement | null;
      if (target && typeof target.closest === "function") {
        const isChatbot =
          target.id === "chatbot-text-input" ||
          Boolean(target.closest("#chatbot-window")) ||
          Boolean(target.closest("[data-chatbot]"));
        const isTextarea = target.tagName === "TEXTAREA";
        const isContentEditable = target.isContentEditable;
        const isInsideModal =
          Boolean(target.closest("[role='dialog']")) ||
          Boolean(target.closest(".modal")) ||
          Boolean(target.closest("[data-modal]"));

        if (isChatbot || isTextarea || isContentEditable || isInsideModal) {
          bufferRef.current = [];
          return;
        }
      }

      const now = Date.now();
      const timeDiff = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // 4. Khi nhấn phím Enter: kiểm tra xem có chuỗi mã vạch quét tốc độ cao từ máy quét không
      if (e.key === "Enter") {
        if (bufferRef.current.length >= minBarcodeLength) {
          const barcode = bufferRef.current.join("").trim();
          bufferRef.current = [];
          // Phải thỏa mãn chuỗi mã vạch chuẩn (ít nhất 4 ký tự ASCII hợp lệ)
          if (
            barcode.length >= minBarcodeLength &&
            VALID_BARCODE_STRING_REGEX.test(barcode)
          ) {
            e.preventDefault();
            e.stopPropagation();
            onScanRef.current(barcode);
          }
        } else {
          bufferRef.current = [];
        }
        return;
      }

      // 5. Nếu khoảng cách giữa 2 phím quá chậm (> maxIntervalMs), xóa bộ đệm (người gõ tay bình thường)
      if (timeDiff > maxIntervalMs) {
        bufferRef.current = [];
      }

      // 6. Chỉ chấp nhận các ký tự mã vạch 1 ký tự chuẩn ASCII (loại bỏ dấu tiếng Việt 'ê', khoảng trắng...)
      if (e.key.length === 1) {
        if (!VALID_BARCODE_CHAR_REGEX.test(e.key)) {
          bufferRef.current = [];
          return;
        }
        bufferRef.current.push(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, minBarcodeLength, maxIntervalMs]);
};
