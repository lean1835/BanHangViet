import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bot,
  Send,
  Mic,
  MicOff,
  X,
  RotateCcw,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Users,
  Loader2,
  Sparkles,
  GripHorizontal,
} from "lucide-react";
import {
  useSendChatbotMessageMutation,
  useGetChatbotQuickSuggestionsQuery,
} from "../services/chatbotApi";
import { useChatbotVoice } from "../hooks/useChatbotVoice";
import type { IChatMessage, IChatHistoryItem } from "../types/chatbot.types";
import { STORAGE_KEYS } from "@/constants/app";
import { USER_ROLES } from "@/constants/roles";

const getInitialGreeting = (roleCode?: string, fullName?: string): IChatMessage => {
  const isCashier = roleCode === USER_ROLES.CASHIER || roleCode === "VT-02";
  const isAccountant = roleCode === USER_ROLES.ACCOUNTANT || roleCode === "VT-03";
  const nowTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  if (isCashier) {
    return {
      id: "msg-init",
      role: "assistant",
      text: `Xin chào${fullName ? ` **${fullName}**` : ""}! Tôi là **Trợ lý AI Bán Hàng**.\nTôi có thể hỗ trợ bạn hướng dẫn quy trình bán hàng tại quầy POS, tra cứu ca trực, xuất hóa đơn máy tính tiền và phím tắt thao tác nhanh.`,
      timestamp: nowTime,
      geminiPowered: false,
      suggestedQuestions: [
        "Có mấy khách hàng thân thiết?",
        "Tình trạng ca bán hàng & tiền két hiện tại?",
        "Phím tắt thanh toán nhanh trên POS",
        "Quy trình xuất hóa đơn máy tính tiền ngay",
      ],
    };
  }

  if (isAccountant) {
    return {
      id: "msg-init",
      role: "assistant",
      text: `Xin chào${fullName ? ` **${fullName}**` : ""}! Tôi là **Trợ lý AI Kế Toán & Thuế**.\nTôi có thể hỗ trợ bạn tra cứu sổ sách Thông tư 88, hóa đơn điện tử TT78, tiến độ nộp thuế, công nợ và lợi nhuận.`,
      timestamp: nowTime,
      geminiPowered: false,
      suggestedQuestions: [
        "Hạn nộp tờ khai thuế hộ kinh doanh quý này?",
        "Báo cáo lợi nhuận gộp hôm nay",
        "Tổng nợ phải trả cho nhà cung cấp hiện tại?",
        "Kiểm tra hóa đơn lỗi chưa gửi Cơ quan Thuế",
      ],
    };
  }

  return {
    id: "msg-init",
    role: "assistant",
    text: `Xin chào${fullName ? ` **${fullName}**` : ""}! Tôi là **Trợ lý AI Bán Hàng**.\nTôi có thể hỗ trợ bạn tra cứu nhanh doanh thu, tồn kho, công nợ và hóa đơn điện tử.`,
    timestamp: nowTime,
    geminiPowered: false,
    suggestedQuestions: [
      "Doanh thu hôm nay bao nhiêu?",
      "Có hàng nào sắp hết trong kho?",
      "Kiểm tra hóa đơn lỗi gửi Thuế",
      "Tổng công nợ khách hàng",
    ],
  };
};

export const ChatbotWidget: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getUserInfo = () => {
    if (typeof window === "undefined") return { roleCode: "VT-01", fullName: "" };
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (saved) {
        const u = JSON.parse(saved);
        return {
          roleCode: u?.role?.code || u?.roleId || "VT-01",
          fullName: u?.fullName || "",
        };
      }
    } catch {
      // ignore
    }
    return { roleCode: "VT-01", fullName: "" };
  };

  const { roleCode, fullName } = getUserInfo();
  const isCashier = roleCode === USER_ROLES.CASHIER || roleCode === "VT-02";
  const isAccountant = roleCode === USER_ROLES.ACCOUNTANT || roleCode === "VT-03";

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [messages, setMessages] = useState<IChatMessage[]>(() => [
    getInitialGreeting(roleCode, fullName),
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [sendMessageMutation, { isLoading: isSending }] = useSendChatbotMessageMutation();
  const { data: quickSuggestionsData } = useGetChatbotQuickSuggestionsQuery(location.pathname);

  // Draggable FAB State & Position Persistence (Tránh che khuất các nút thao tác)
  const FAB_STORAGE_KEY = "BANHANGVIET_CHATBOT_FAB_POS";
  const isPosScreen = location.pathname.startsWith("/pos");

  const FAB_WIDTH = 130;
  const FAB_HEIGHT = 44;
  const WIN_WIDTH = 380;
  const WIN_HEIGHT = 520;

  const getDefaultPosition = useCallback(() => {
    if (typeof window === "undefined") return { x: 24, y: 100 };
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    if (isPosScreen) {
      // Màn bán hàng (POS): Góc dưới bên phải là khu vực nút Thanh toán (F9).
      // Đặt mặc định ở góc dưới bên trái (x: 24px) để KHÔNG BAO GIỜ che khuất nút Thanh toán / Hủy đơn.
      return { x: 24, y: Math.max(12, winHeight - 64) };
    }
    // Các màn hình quản lý khác: Đặt mặc định ở góc dưới bên phải
    return { x: Math.max(12, winWidth - 160), y: Math.max(12, winHeight - 64) };
  }, [isPosScreen]);

  // Đánh dấu xem vị trí đã bị kéo tùy chỉnh hay đang dùng neo góc mặc định (1.5rem)
  const [hasCustomPosition, setHasCustomPosition] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return !!localStorage.getItem(FAB_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    return false;
  });

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(FAB_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            const maxX = Math.max(12, window.innerWidth - 160);
            const maxY = Math.max(12, window.innerHeight - 64);
            return {
              x: Math.min(Math.max(12, parsed.x), maxX),
              y: Math.min(Math.max(12, parsed.y), maxY),
            };
          }
        }
      } catch {
        // ignore
      }
    }
    return getDefaultPosition();
  });

  // Tính toán vị trí cửa sổ chat khi mở từ tọa độ nút đóng (FAB)
  const getWindowPosition = useCallback(() => {
    if (typeof window === "undefined") return { x: 24, y: 100, isRight: false };
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    const isRight = position.x >= winWidth / 2;
    const winX = isRight ? position.x + FAB_WIDTH - WIN_WIDTH : position.x;
    const winY = position.y + FAB_HEIGHT - WIN_HEIGHT;

    return {
      x: Math.min(Math.max(8, winX), Math.max(8, winWidth - WIN_WIDTH - 8)),
      y: Math.min(Math.max(8, winY), Math.max(8, winHeight - WIN_HEIGHT - 8)),
      isRight,
    };
  }, [position]);

  // Xóa key cũ bị lệch nếu có trong localStorage
  useEffect(() => {
    try {
      localStorage.removeItem("BANHANGVIET_CHATBOT_WINDOW_POS");
    } catch {
      // ignore
    }
  }, []);

  // Tự động chuyển đổi vị trí mặc định thông minh khi vào/ra màn POS (nếu người dùng chưa tự kéo thả)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAB_STORAGE_KEY);
      if (!saved) {
        setPosition(getDefaultPosition());
        setHasCustomPosition(false);
      }
    } catch {
      // ignore
    }
  }, [isPosScreen, getDefaultPosition]);

  // Giữ vị trí trong màn hình khi co giãn cửa sổ trình duyệt
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = Math.max(12, window.innerWidth - 160);
        const maxY = Math.max(12, window.innerHeight - 64);
        return {
          x: Math.min(Math.max(12, prev.x), maxX),
          y: Math.min(Math.max(12, prev.y), maxY),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Xử lý kéo thả nút FAB (Zero-latency Native Pointer Events - bám sát con trỏ chuột)
  const fabRef = useRef<HTMLButtonElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const currentFabDragPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== undefined && e.button !== 0) return; // Chỉ nhận chuột trái hoặc touch/synthetic
    const el = fabRef.current;
    if (!el) return;

    // Ngăn chặn trình duyệt kích hoạt text selection / button drag suppression
    e.preventDefault();

    isDraggingRef.current = true;
    hasMovedRef.current = false;

    // Lấy vị trí thực tế trên màn hình (chính xác đến từng subpixel)
    const rect = el.getBoundingClientRect();
    const currentX = rect.left !== 0 ? rect.left : position.x;
    const currentY = rect.top !== 0 ? rect.top : position.y;

    dragStartRef.current = {
      startX: e.clientX ?? 0,
      startY: e.clientY ?? 0,
      posX: currentX,
      posY: currentY,
    };
    currentFabDragPosRef.current = { x: currentX, y: currentY };

    // TẮT HOÀN TOÀN TRANSITION TRÊN FAB VÀ BẬT GPU ACCELERATION
    el.style.setProperty("transition", "none", "important");
    el.style.willChange = "left, top";

    // Cập nhật vị trí nút FAB bám sát chuột tức thì 0ms
    const updateFabPosition = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current || !fabRef.current) return;
      const dx = clientX - dragStartRef.current.startX;
      const dy = clientY - dragStartRef.current.startY;

      if (Math.hypot(dx, dy) > 2) {
        hasMovedRef.current = true;
      }

      const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
      const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;
      const width = fabRef.current.offsetWidth || FAB_WIDTH;
      const height = fabRef.current.offsetHeight || FAB_HEIGHT;

      // Giới hạn trong màn hình chính xác theo kích thước thực tế của nút (cách mép 8px)
      const maxX = Math.max(8, winWidth - width - 8);
      const maxY = Math.max(8, winHeight - height - 8);
      const nextX = Math.min(Math.max(8, dragStartRef.current.posX + dx), maxX);
      const nextY = Math.min(Math.max(8, dragStartRef.current.posY + dy), maxY);

      currentFabDragPosRef.current = { x: nextX, y: nextY };

      // CẬP NHẬT TRỰC TIẾP LÊN DOM -> 0MS DELAY, THEO TAY NGAY LẬP TỨC
      fabRef.current.style.left = `${nextX}px`;
      fabRef.current.style.top = `${nextY}px`;
    };

    // Native window move listener: Bắt 100% sự kiện di chuyển chuột tần số cao từ OS dù chuột vẩy nhanh ra ngoài nút
    const onNativeMove = (ev: PointerEvent) => {
      updateFabPosition(ev.clientX ?? 0, ev.clientY ?? 0);
    };

    // Native window up listener
    const onNativeUp = () => {
      window.removeEventListener("pointermove", onNativeMove);
      window.removeEventListener("pointerup", onNativeUp);
      window.removeEventListener("pointercancel", onNativeUp);

      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      if (fabRef.current) {
        fabRef.current.style.willChange = "";
        fabRef.current.style.removeProperty("transition");
      }

      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      if (hasMovedRef.current && currentFabDragPosRef.current) {
        const finalPos = currentFabDragPosRef.current;
        setPosition(finalPos);
        setHasCustomPosition(true);
        try {
          localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(finalPos));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("pointermove", onNativeMove, { passive: false });
    window.addEventListener("pointerup", onNativeUp, { passive: false });
    window.addEventListener("pointercancel", onNativeUp, { passive: false });

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current || !fabRef.current) return;
    const dx = (e.clientX ?? 0) - dragStartRef.current.startX;
    const dy = (e.clientY ?? 0) - dragStartRef.current.startY;

    if (Math.hypot(dx, dy) > 2) {
      hasMovedRef.current = true;
    }

    const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const width = fabRef.current.offsetWidth || FAB_WIDTH;
    const height = fabRef.current.offsetHeight || FAB_HEIGHT;

    const maxX = Math.max(8, winWidth - width - 8);
    const maxY = Math.max(8, winHeight - height - 8);
    const nextX = Math.min(Math.max(8, dragStartRef.current.posX + dx), maxX);
    const nextY = Math.min(Math.max(8, dragStartRef.current.posY + dy), maxY);

    currentFabDragPosRef.current = { x: nextX, y: nextY };

    fabRef.current.style.left = `${nextX}px`;
    fabRef.current.style.top = `${nextY}px`;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (fabRef.current) {
      fabRef.current.style.willChange = "";
      fabRef.current.style.removeProperty("transition");
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (hasMovedRef.current && currentFabDragPosRef.current) {
      const finalPos = currentFabDragPosRef.current;
      setPosition(finalPos);
      setHasCustomPosition(true);
      try {
        localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(finalPos));
      } catch {
        // ignore
      }
    }
  };

  const handleFabClick = () => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    setIsOpen(true);
  };

  const handleResetPosition = () => {
    try {
      localStorage.removeItem(FAB_STORAGE_KEY);
      localStorage.removeItem("BANHANGVIET_CHATBOT_WINDOW_POS");
    } catch {
      // ignore
    }
    setHasCustomPosition(false);
    setPosition(getDefaultPosition());
    if (windowRef.current) {
      windowRef.current.style.left = "";
      windowRef.current.style.top = "";
      windowRef.current.style.right = "";
      windowRef.current.style.bottom = "";
      windowRef.current.style.transition = "";
    }
    currentDragPosRef.current = null;
  };

  // Draggable Open Chat Window State (Di chuyển khung chat khi đang mở)
  const windowRef = useRef<HTMLDivElement>(null);
  const isWindowDraggingRef = useRef(false);
  const hasWindowMovedRef = useRef(false);
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const windowDragStartRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
  }>({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const currentDragPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleWindowPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== undefined && e.button !== 0) return; // Chỉ nhận chuột trái hoặc touch/synthetic
    if ((e.target as HTMLElement).closest("button")) return;

    const el = windowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    const currentWinPos = getWindowPosition();
    const currentX = rect.left !== 0 ? rect.left : currentWinPos.x;
    const currentY = rect.top !== 0 ? rect.top : currentWinPos.y;

    isWindowDraggingRef.current = true;
    hasWindowMovedRef.current = false;
    setIsDraggingWindow(true);

    windowDragStartRef.current = {
      startX: e.clientX ?? 0,
      startY: e.clientY ?? 0,
      posX: currentX,
      posY: currentY,
    };
    currentDragPosRef.current = { x: currentX, y: currentY };

    // TẮT HOÀN TOÀN TRANSITION TRÊN DOM VÀ BẬT GPU ACCELERATION
    el.style.setProperty("transition", "none", "important");
    el.style.willChange = "left, top";

    const updateWindowPosition = (clientX: number, clientY: number) => {
      if (!isWindowDraggingRef.current || !windowRef.current) return;
      const dx = clientX - windowDragStartRef.current.startX;
      const dy = clientY - windowDragStartRef.current.startY;

      if (Math.hypot(dx, dy) > 2) {
        hasWindowMovedRef.current = true;
      }

      const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
      const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;
      const width = windowRef.current.offsetWidth || WIN_WIDTH;
      const height = windowRef.current.offsetHeight || WIN_HEIGHT;

      const maxX = Math.max(8, winWidth - width - 8);
      const maxY = Math.max(8, winHeight - height - 8);

      const nextX = Math.min(Math.max(8, windowDragStartRef.current.posX + dx), maxX);
      const nextY = Math.min(Math.max(8, windowDragStartRef.current.posY + dy), maxY);

      currentDragPosRef.current = { x: nextX, y: nextY };

      // CẬP NHẬT TRỰC TIẾP LÊN DOM STYLE -> ĐỘ TRỄ 0MS, THEO TAY NGAY LẬP TỨC
      windowRef.current.style.left = `${nextX}px`;
      windowRef.current.style.top = `${nextY}px`;
      windowRef.current.style.right = "auto";
      windowRef.current.style.bottom = "auto";
    };

    // Native window move listener cho khung chat
    const onNativeWindowMove = (ev: PointerEvent) => {
      updateWindowPosition(ev.clientX ?? 0, ev.clientY ?? 0);
    };

    // Native window up listener cho khung chat
    const onNativeWindowUp = () => {
      window.removeEventListener("pointermove", onNativeWindowMove);
      window.removeEventListener("pointerup", onNativeWindowUp);
      window.removeEventListener("pointercancel", onNativeWindowUp);

      if (!isWindowDraggingRef.current) return;
      isWindowDraggingRef.current = false;
      setIsDraggingWindow(false);

      if (windowRef.current) {
        windowRef.current.style.willChange = "";
        windowRef.current.style.removeProperty("transition");
      }

      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      // ĐỒNG NHẤT 100%: Khi kéo khung chat ở trạng thái mở, tự động cập nhật vị trí nút FAB tương ứng
      if (hasWindowMovedRef.current && currentDragPosRef.current) {
        const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
        const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;
        const finalWinX = currentDragPosRef.current.x;
        const finalWinY = currentDragPosRef.current.y;

        const isRight = finalWinX >= winWidth / 2;
        const newFabX = isRight ? finalWinX + WIN_WIDTH - FAB_WIDTH : finalWinX;
        const newFabY = finalWinY + WIN_HEIGHT - FAB_HEIGHT;
        const clampedFabX = Math.min(Math.max(12, newFabX), Math.max(12, winWidth - FAB_WIDTH - 12));
        const clampedFabY = Math.min(Math.max(12, newFabY), Math.max(12, winHeight - FAB_HEIGHT - 12));
        const newFabPos = { x: clampedFabX, y: clampedFabY };

        setPosition(newFabPos);
        setHasCustomPosition(true);
        try {
          localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(newFabPos));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("pointermove", onNativeWindowMove, { passive: false });
    window.addEventListener("pointerup", onNativeWindowUp, { passive: false });
    window.addEventListener("pointercancel", onNativeWindowUp, { passive: false });

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleWindowPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isWindowDraggingRef.current || !windowRef.current) return;
    const dx = (e.clientX ?? 0) - windowDragStartRef.current.startX;
    const dy = (e.clientY ?? 0) - windowDragStartRef.current.startY;

    if (Math.hypot(dx, dy) > 2) {
      hasWindowMovedRef.current = true;
    }

    const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const width = windowRef.current.offsetWidth || WIN_WIDTH;
    const height = windowRef.current.offsetHeight || WIN_HEIGHT;

    const maxX = Math.max(8, winWidth - width - 8);
    const maxY = Math.max(8, winHeight - height - 8);

    const nextX = Math.min(Math.max(8, windowDragStartRef.current.posX + dx), maxX);
    const nextY = Math.min(Math.max(8, windowDragStartRef.current.posY + dy), maxY);

    currentDragPosRef.current = { x: nextX, y: nextY };

    // CẬP NHẬT TRỰC TIẾP LÊN DOM STYLE -> ĐỘ TRỄ 0MS, THEO TAY NGAY LẬP TỨC
    windowRef.current.style.left = `${nextX}px`;
    windowRef.current.style.top = `${nextY}px`;
    windowRef.current.style.right = "auto";
    windowRef.current.style.bottom = "auto";
  };

  const handleWindowPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isWindowDraggingRef.current) return;
    isWindowDraggingRef.current = false;
    setIsDraggingWindow(false);

    if (windowRef.current) {
      windowRef.current.style.willChange = "";
      windowRef.current.style.removeProperty("transition");
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // ĐỒNG NHẤT 100%: Khi kéo khung chat ở trạng thái mở, tự động cập nhật vị trí nút FAB tương ứng
    if (hasWindowMovedRef.current && currentDragPosRef.current) {
      const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
      const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;
      const finalWinX = currentDragPosRef.current.x;
      const finalWinY = currentDragPosRef.current.y;

      const isRight = finalWinX >= winWidth / 2;
      const newFabX = isRight ? finalWinX + WIN_WIDTH - FAB_WIDTH : finalWinX;
      const newFabY = finalWinY + WIN_HEIGHT - FAB_HEIGHT;
      const clampedFabX = Math.min(Math.max(12, newFabX), Math.max(12, winWidth - FAB_WIDTH - 12));
      const clampedFabY = Math.min(Math.max(12, newFabY), Math.max(12, winHeight - FAB_HEIGHT - 12));
      const newFabPos = { x: clampedFabX, y: clampedFabY };

      setPosition(newFabPos);
      setHasCustomPosition(true);
      try {
        localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(newFabPos));
      } catch {
        // ignore
      }
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, scrollToBottom]);

  // Voice speech integration
  const handleVoiceFinal = useCallback((finalText: string) => {
    if (finalText) {
      setInputMessage((prev) => (prev ? `${prev} ${finalText}` : finalText));
    }
  }, []);

  const {
    isListening,
    interimTranscript,
    isSupported: isVoiceSupported,
    errorMessage: voiceError,
    startListening,
    stopListening,
  } = useChatbotVoice({ onTranscriptFinal: handleVoiceFinal });

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputRef.current?.value || inputMessage).trim();
    if (!query || isSending) return;

    const userMessageId = `user-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const newUserMsg: IChatMessage = {
      id: userMessageId,
      role: "user",
      text: query,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    // Build history for backend LLM
    const historyPayload: IChatHistoryItem[] = messages
      .filter((m) => m.id !== "msg-init" && !m.isError)
      .slice(-6)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    try {
      const response = await sendMessageMutation({
        message: query,
        currentScreen: location.pathname,
        history: historyPayload,
      }).unwrap();

      if (response && response.result) {
        const assistantMsg: IChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: response.result.reply,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          actionType: response.result.actionType,
          actionLabel: response.result.actionLabel,
          actionUrl: response.result.actionUrl,
          geminiPowered: response.result.geminiPowered,
          activeModel: response.result.activeModel,
          dataPayload: response.result.dataPayload,
          suggestedQuestions: response.result.suggestedQuestions,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      console.error("Chatbot sendMessage error:", err);
      let errorText = "Không thể kết nối đến máy chủ trợ lý. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.";
      if (err?.status === 500 && err?.data?.message?.includes("No static resource")) {
        errorText = "Máy chủ backend chưa nạp endpoint Trợ lý AI (Cần khởi động lại terminal backend 'mvn spring-boot:run' để nhận Controller mới).";
      } else if (err?.data?.message) {
        errorText = err.data.message;
      }

      const errorMsg: IChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        text: errorText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([getInitialGreeting(roleCode, fullName)]);
  };

  const handleActionClick = (url?: string) => {
    if (url) {
      navigate(url);
    }
  };

  // Helper render markdown inline content (bold, code, text)
  const renderInlineContent = (line: string, isUser = false) => {
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={pIdx} className={`font-bold ${isUser ? "text-white" : "text-slate-900"}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={pIdx}
            className={`px-1 py-0.5 rounded text-[11px] font-mono border ${
              isUser
                ? "bg-blue-700/80 text-white border-blue-400/40"
                : "bg-slate-100 text-blue-700 border-slate-200"
            }`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={pIdx} className={isUser ? "text-white" : undefined}>{part}</span>;
    });
  };

  // Helper render full markdown (including tables, lists, headings) without LaTeX
  const renderFormattedText = (text: string, isUser = false) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    const isTableRow = (l: string) => {
      const s = l.trim();
      return s.startsWith("|") && s.endsWith("|") && s.length > 2;
    };

    const isTableSep = (l: string) => {
      const s = l.trim();
      return s.startsWith("|") && /^\|[\s:-]+(\|[\s:-]+)*\|$/.test(s);
    };

    const getAlignmentClass = (sep: string) => {
      const s = sep.trim();
      if (s.startsWith(":") && s.endsWith(":")) return "text-center";
      if (s.endsWith(":")) return "text-right";
      return "text-left";
    };

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Markdown Table Parsing
      if (isTableRow(trimmed) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        const headerLine = trimmed;
        const separatorLine = lines[i + 1].trim();
        const dataLines: string[] = [];
        i += 2;
        while (i < lines.length && isTableRow(lines[i])) {
          dataLines.push(lines[i].trim());
          i++;
        }

        const headers = headerLine
          .split("|")
          .slice(1, -1)
          .map((h) => h.trim());

        const alignments = separatorLine
          .split("|")
          .slice(1, -1)
          .map(getAlignmentClass);

        const rows = dataLines.map((rowLine) =>
          rowLine
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        );

        elements.push(
          <div
            key={`table-${i}`}
            className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs max-w-full"
          >
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className={`px-3 py-2 ${alignments[hIdx] || "text-left"} border-r last:border-r-0 border-slate-200 whitespace-nowrap`}
                    >
                      {renderInlineContent(h, isUser)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={
                      rIdx % 2 === 0
                        ? "bg-white hover:bg-blue-50/40 transition-colors"
                        : "bg-slate-50/50 hover:bg-blue-50/40 transition-colors"
                    }
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-3 py-2 text-slate-800 ${alignments[cIdx] || "text-left"} border-r last:border-r-0 border-slate-100`}
                      >
                        {renderInlineContent(cell, isUser)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // 2. Headings (###, ##, #)
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4 key={`h4-${i}`} className={`font-bold text-xs mt-2 mb-1 ${isUser ? "text-white" : "text-slate-900"}`}>
            {renderInlineContent(trimmed.substring(4), isUser)}
          </h4>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h3 key={`h3-${i}`} className={`font-bold text-sm mt-2.5 mb-1 ${isUser ? "text-white" : "text-slate-900"}`}>
            {renderInlineContent(trimmed.substring(3), isUser)}
          </h3>
        );
        i++;
        continue;
      }

      // 3. Bullet list (- or *)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <li key={`li-${i}`} className={`ml-4 list-disc my-0.5 leading-relaxed ${isUser ? "text-white" : "text-slate-700"}`}>
            {renderInlineContent(trimmed.substring(2), isUser)}
          </li>
        );
        i++;
        continue;
      }

      // 4. Numbered list (1. 2.)
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        elements.push(
          <li key={`oli-${i}`} className={`ml-4 list-decimal my-0.5 leading-relaxed ${isUser ? "text-white" : "text-slate-700"}`}>
            {renderInlineContent(numMatch[2], isUser)}
          </li>
        );
        i++;
        continue;
      }

      // 5. Empty spacer
      if (!trimmed) {
        elements.push(<div key={`sp-${i}`} className="h-1.5" />);
        i++;
        continue;
      }

      // 6. Regular paragraph
      elements.push(
        <p key={`p-${i}`} className={`my-0.5 leading-relaxed ${isUser ? "text-white" : "text-slate-800"}`}>
          {renderInlineContent(line, isUser)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return (
    <>
      {/* Floating Action Button (Basic, gọn gàng, kéo thả tự do - 0ms delay) */}
      {!isOpen && (
        <button
          ref={fabRef}
          id="chatbot-fab-button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleFabClick}
          onContextMenu={(e) => {
            e.preventDefault();
            handleResetPosition();
          }}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            touchAction: "none",
            transition: "none",
          }}
          className="fixed z-50 flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/25 select-none cursor-grab active:cursor-grabbing hover:shadow-xl group"
          title="Trợ lý AI Bán hàng (Kéo thả để di chuyển; Chuột phải để về mặc định)"
          aria-label="Trợ lý AI Bán hàng"
        >
          <Bot className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-xs tracking-wide">Trợ lý AI</span>
        </button>
      )}

      {/* Chat Window: Basic, ít chữ, ít nút - Có thể kéo di chuyển tự do */}
      {isOpen && (
        <div
          ref={windowRef}
          id="chatbot-window"
          style={{
            left: hasCustomPosition
              ? `${getWindowPosition().x}px`
              : position.x < (typeof window !== "undefined" ? window.innerWidth / 2 : 500)
              ? "1.5rem"
              : "auto",
            right: hasCustomPosition
              ? "auto"
              : position.x >= (typeof window !== "undefined" ? window.innerWidth / 2 : 500)
              ? "1.5rem"
              : "auto",
            top: hasCustomPosition ? `${getWindowPosition().y}px` : "auto",
            bottom: hasCustomPosition ? "auto" : "1.5rem",
            // Tuyệt đối không để transition lên left/top để đảm bảo kéo di chuyển tức thì 0ms delay
            transition: "none",
          }}
          className={`fixed z-50 flex flex-col bg-white rounded-2xl border overflow-hidden w-[92vw] sm:w-[380px] h-[520px] max-h-[82vh] ${
            isDraggingWindow
              ? "shadow-2xl ring-2 ring-blue-500/40 border-blue-400 select-none"
              : "shadow-xl border-slate-200"
          }`}
        >
          {/* Header: Có thể kéo di chuyển khung chat (Drag handle) */}
          <div
            onPointerDown={handleWindowPointerDown}
            onPointerMove={handleWindowPointerMove}
            onPointerUp={handleWindowPointerUp}
            onPointerCancel={handleWindowPointerUp}
            onDoubleClick={handleResetPosition}
            onContextMenu={(e) => {
              e.preventDefault();
              handleResetPosition();
            }}
            style={{ touchAction: "none" }}
            className={`flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-slate-100 select-none cursor-grab active:cursor-grabbing hover:bg-slate-50/90 transition-colors group ${
              isDraggingWindow ? "cursor-grabbing bg-blue-50/40" : ""
            }`}
            title="Kéo thanh tiêu đề để di chuyển khung chat (Nhấp đúp hoặc chuột phải để về vị trí mặc định)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 truncate">
                <h2 className="font-semibold text-sm text-slate-800 truncate">
                  Trợ lý AI Bán hàng
                </h2>
                <span className="inline-flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>

            {/* Handle icon trực quan thể hiện khả năng kéo di chuyển */}
            <div
              className="flex items-center text-slate-300 group-hover:text-blue-500 transition-colors px-1"
              title="Kéo thanh tiêu đề để di chuyển khung chat"
            >
              <GripHorizontal className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-1 text-slate-400 shrink-0">
              <button
                onClick={() => setShowCategoryPanel((prev) => !prev)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showCategoryPanel
                    ? "text-blue-600 bg-blue-50"
                    : "hover:text-slate-700 hover:bg-slate-100"
                }`}
                title="Phân mục gợi ý câu hỏi theo vai trò"
                aria-label="Phân mục gợi ý"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetChat}
                className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Làm mới cuộc trò chuyện"
                aria-label="Làm mới chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Đóng trợ lý"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Phân mục gợi ý theo vai trò (Quick Category Drawer) */}
          {showCategoryPanel && (
            <div className="bg-slate-50 border-b border-slate-200 p-3 max-h-[220px] overflow-y-auto space-y-2 text-xs shadow-inner">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Phân mục gợi ý ({isCashier ? "Thu ngân" : isAccountant ? "Kế toán" : "Chủ hộ"})
                </span>
                <button
                  onClick={() => setShowCategoryPanel(false)}
                  className="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
                >
                  Đóng
                </button>
              </div>
              {quickSuggestionsData?.result?.map((cat, cIdx) => {
                const qList = cat.suggestions || cat.items?.map((it) => it.prompt) || [];
                if (qList.length === 0) return null;
                return (
                  <div key={cIdx} className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {cat.category}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {qList.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => {
                            setShowCategoryPanel(false);
                            handleSendMessage(sug);
                          }}
                          className="text-[11px] px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-md border border-slate-200 hover:border-blue-300 transition-colors text-left cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs transition-all ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : msg.isError
                      ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                  }`}
                >
                  {/* Body Content */}
                  <div className={`space-y-1 ${msg.role === "user" ? "text-white" : ""}`}>
                    {renderFormattedText(msg.text, msg.role === "user")}
                  </div>

                  {/* Action Link Card (Deep Link) - Cho phép điều hướng theo đúng phân quyền (Thu ngân được truy cập ca, pos, khách hàng) */}
                  {msg.actionUrl && msg.actionLabel && (!isCashier || msg.actionUrl === "/shifts" || msg.actionUrl === "/pos" || msg.actionUrl === "/customers") && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => handleActionClick(msg.actionUrl)}
                        className="w-full flex items-center justify-between p-2.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-xl border border-blue-200/80 font-medium transition-all group cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {msg.actionType === "VIEW_REPORT" && (
                            <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          {msg.actionType === "VIEW_INVENTORY" && (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          {msg.actionType === "VIEW_INVOICES" && (
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                          {(msg.actionType === "VIEW_DEBT" || msg.actionType === "VIEW_CUSTOMERS") && (
                            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="truncate">{msg.actionLabel}</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-blue-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                      </button>
                    </div>
                  )}

                  {/* Phân mục câu hỏi gợi ý cho tin nhắn chào mừng (msg-init) hoặc Suggested Follow-up Chips */}
                  {msg.id === "msg-init" && quickSuggestionsData?.result && quickSuggestionsData.result.length > 0 ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2.5">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        Phân mục gợi ý nhanh:
                      </div>
                      {quickSuggestionsData.result.map((cat, cIdx) => {
                        const questionList = cat.suggestions || cat.items?.map((it) => it.prompt) || [];
                        if (questionList.length === 0) return null;
                        return (
                          <div key={cIdx} className="space-y-1">
                            <div className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {cat.category}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {questionList.map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => handleSendMessage(sug)}
                                  className="text-[11px] px-2 py-0.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer text-left"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : msg.suggestedQuestions && msg.suggestedQuestions.length > 0 ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* Timestamp */}
                  <div
                    className={`mt-1.5 flex items-center justify-end text-[10px] ${
                      msg.role === "user" ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* In-flight loading indicator */}
            {isSending && (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-slate-600">Đang tổng hợp câu trả lời...</span>
                </div>
              </div>
            )}

            {/* Voice listening pulse indicator */}
            {isListening && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>
                    {interimTranscript
                      ? `"${interimTranscript}"`
                      : "Đang lắng nghe giọng nói tiếng Việt..."}
                  </span>
                </div>
                <button
                  onClick={stopListening}
                  className="px-2 py-0.5 bg-rose-200 hover:bg-rose-300 text-rose-800 rounded text-[11px] font-medium cursor-pointer"
                >
                  Dừng
                </button>
              </div>
            )}

            {voiceError && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                {voiceError}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              {/* Voice recognition toggle */}
              {isVoiceSupported && (
                <button
                  id="chatbot-voice-mic-button"
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    isListening
                      ? "bg-rose-500 text-white shadow-sm ring-2 ring-rose-200 animate-pulse"
                      : "text-slate-500 hover:text-blue-600 hover:bg-slate-200"
                  }`}
                  title={
                    isListening
                      ? "Đang ghi âm (nhấn để dừng)"
                      : "Nói bằng giọng nói tiếng Việt"
                  }
                  aria-label="Thu âm giọng nói"
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Text input */}
              <input
                ref={inputRef}
                id="chatbot-text-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? "Đang lắng nghe..."
                    : isCashier
                    ? "Hỏi về ca bán hàng, phím tắt POS, hóa đơn..."
                    : isAccountant
                    ? "Hỏi thuế TT88, hóa đơn TT78, công nợ, lợi nhuận..."
                    : "Hỏi doanh thu, tồn kho, hóa đơn, công nợ..."
                }
                disabled={isSending}
                className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none px-2 py-1"
              />

              {/* Send button */}
              <button
                id="chatbot-send-button"
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isSending}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                title="Gửi tin nhắn"
                aria-label="Gửi"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
