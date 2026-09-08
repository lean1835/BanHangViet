package com.sales.utils;

public final class DeviceDetectionUtil {

    private DeviceDetectionUtil() {
        // Utility class
    }

    public static String detectDeviceType(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "UNKNOWN";
        }
        String ua = userAgent.toLowerCase();
        if (ua.contains("pos") || ua.contains("sunmi") || ua.contains("imin") || ua.contains("terminal")) {
            return "POS";
        }
        if (ua.contains("ipad") || ua.contains("tablet")) {
            return "TABLET";
        }
        if (ua.contains("mobile") || ua.contains("iphone") || ua.contains("android")) {
            return "MOBILE";
        }
        return "DESKTOP";
    }

    public static String detectDeviceName(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Thiết bị không xác định";
        }
        String ua = userAgent.toLowerCase();

        String browser = "Trình duyệt";
        if (ua.contains("edg/")) {
            browser = "Microsoft Edge";
        } else if (ua.contains("chrome/") && !ua.contains("edg/")) {
            browser = "Chrome";
        } else if (ua.contains("safari/") && !ua.contains("chrome/")) {
            browser = "Safari";
        } else if (ua.contains("firefox/")) {
            browser = "Firefox";
        } else if (ua.contains("opera/") || ua.contains("opr/")) {
            browser = "Opera";
        } else if (ua.contains("pos") || ua.contains("sunmi") || ua.contains("imin")) {
            browser = "Ứng dụng POS";
        }

        String os = "Hệ điều hành";
        if (ua.contains("windows")) {
            os = "Windows";
        } else if (ua.contains("macintosh") || ua.contains("mac os")) {
            os = "macOS";
        } else if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) {
            os = "iOS";
        } else if (ua.contains("android")) {
            os = "Android";
        } else if (ua.contains("linux")) {
            os = "Linux";
        }

        return browser + " trên " + os;
    }
}
