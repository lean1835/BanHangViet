import { useState, useEffect } from "react";

interface NetworkInformation extends EventTarget {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  rtt?: number;
  downlink?: number;
  saveData?: boolean;
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

const getNetworkConnection = (): NetworkInformation | undefined => {
  if (typeof navigator === "undefined") return undefined;
  const nav = navigator as NavigatorWithConnection;
  return nav.connection || nav.mozConnection || nav.webkitConnection;
};

export interface NetworkStatus {
  isOnline: boolean;
  isSlow: boolean;
  effectiveType?: string;
  rtt?: number;
  liveLatencyMs: number;
}

const calculateDynamicLatency = (
  isOnline: boolean,
  conn?: NetworkInformation,
  baseLatency: number = 85
): number => {
  if (!isOnline) return 0;

  const effectiveType = conn?.effectiveType;
  const rtt = conn?.rtt;

  // F12 Slow 3G
  if (effectiveType === "2g" || effectiveType === "slow-2g" || (typeof rtt === "number" && rtt >= 1500)) {
    const base = typeof rtt === "number" && rtt >= 1000 ? rtt : 2000;
    return Math.floor(base - 60 + Math.random() * 120);
  }

  // F12 Fast 3G
  if (effectiveType === "3g" || (typeof rtt === "number" && rtt >= 400)) {
    const base = typeof rtt === "number" && rtt >= 400 ? rtt : 560;
    return Math.floor(base - 30 + Math.random() * 70);
  }

  // Normal (4G / No throttling)
  const base = typeof rtt === "number" && rtt > 0 && rtt < 400 ? Math.max(40, rtt) : baseLatency;
  return Math.floor(base - 10 + Math.random() * 20);
};

export const useNetworkStatus = (baseLatency: number = 85): NetworkStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof window !== "undefined" && typeof navigator !== "undefined"
      ? navigator.onLine
      : true;
  });

  const [isSlow, setIsSlow] = useState<boolean>(() => {
    const conn = getNetworkConnection();
    if (!conn) return false;
    return (
      conn.effectiveType === "2g" ||
      conn.effectiveType === "slow-2g" ||
      conn.effectiveType === "3g" ||
      (typeof conn.rtt === "number" && conn.rtt >= 400)
    );
  });

  const [effectiveType, setEffectiveType] = useState<string | undefined>(() => {
    const conn = getNetworkConnection();
    return conn?.effectiveType;
  });

  const [rtt, setRtt] = useState<number | undefined>(() => {
    const conn = getNetworkConnection();
    return conn?.rtt;
  });

  const [liveLatencyMs, setLiveLatencyMs] = useState<number>(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return 0;
    return baseLatency;
  });

  useEffect(() => {
    const updateStatus = () => {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      setIsOnline(online);

      const conn = getNetworkConnection();
      if (conn) {
        setEffectiveType(conn.effectiveType);
        setRtt(conn.rtt);
        const slow =
          conn.effectiveType === "2g" ||
          conn.effectiveType === "slow-2g" ||
          conn.effectiveType === "3g" ||
          (typeof conn.rtt === "number" && conn.rtt >= 400);
        setIsSlow(slow);
      } else {
        setIsSlow(false);
      }

      setLiveLatencyMs(calculateDynamicLatency(online, conn, baseLatency));
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    const conn = getNetworkConnection();
    if (conn && typeof conn.addEventListener === "function") {
      conn.addEventListener("change", updateStatus);
    }

    // Interval to dynamically update ms continuously (every 2 seconds) for realistic live ping
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (import.meta.env.MODE !== "test") {
      intervalId = setInterval(() => {
        const currentConn = getNetworkConnection();
        const currentOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
        setLiveLatencyMs(calculateDynamicLatency(currentOnline, currentConn, baseLatency));
      }, 2000);
    }

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      if (conn && typeof conn.removeEventListener === "function") {
        conn.removeEventListener("change", updateStatus);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [baseLatency]);

  return { isOnline, isSlow, effectiveType, rtt, liveLatencyMs };
};

