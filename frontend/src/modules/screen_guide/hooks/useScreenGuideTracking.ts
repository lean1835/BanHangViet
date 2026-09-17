import { useRef, useEffect, useCallback } from "react";
import { useTrackGuideViewMutation } from "../api/screenGuideApi";

interface UseScreenGuideTrackingProps {
  screenCode: string | null;
  isOpen: boolean;
}

export const useScreenGuideTracking = ({
  screenCode,
  isOpen,
}: UseScreenGuideTrackingProps) => {
  const [trackView] = useTrackGuideViewMutation();
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  // Khi Drawer mở, bắt đầu đếm giờ
  useEffect(() => {
    if (isOpen && screenCode) {
      startTimeRef.current = Date.now();
      completedRef.current = false;
    } else if (!isOpen && startTimeRef.current && screenCode) {
      // Khi Drawer đóng, gửi nhật ký thời gian xem
      const elapsedSeconds = Math.max(
        1,
        Math.round((Date.now() - startTimeRef.current) / 1000)
      );
      trackView({
        screenCode,
        data: {
          durationSeconds: elapsedSeconds,
          completed: completedRef.current,
        },
      }).catch(() => {
        // Silent catch tránh unhandled rejection nếu component unmount hoặc offline
      });
      startTimeRef.current = null;
    }
  }, [isOpen, screenCode, trackView]);

  // Đánh dấu đã duyệt xong toàn bộ các bước
  const markCompleted = useCallback(() => {
    completedRef.current = true;
  }, []);

  return {
    markCompleted,
  };
};
