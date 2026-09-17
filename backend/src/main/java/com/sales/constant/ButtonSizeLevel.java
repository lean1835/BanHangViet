package com.sales.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ButtonSizeLevel {
    STANDARD("Tiêu chuẩn", 100, "40px"),
    LARGE("Lớn", 125, "52px"),
    EXTRA_LARGE("Rất lớn", 150, "64px");

    private final String description;
    private final int scalePercentage;
    private final String minTouchHeight;
}
