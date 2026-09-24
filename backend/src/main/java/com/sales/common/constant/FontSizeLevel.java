package com.sales.common.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FontSizeLevel {
    STANDARD("Tiêu chuẩn", 100, "14px"),
    LARGE("Lớn", 125, "18px"),
    EXTRA_LARGE("Rất lớn", 150, "22px");

    private final String description;
    private final int scalePercentage;
    private final String baseFontSize;
}
