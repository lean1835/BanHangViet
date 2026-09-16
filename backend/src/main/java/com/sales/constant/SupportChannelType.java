package com.sales.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SupportChannelType {
    HOTLINE("Tổng đài điện thoại"),
    ZALO("Zalo hỗ trợ"),
    EMAIL("Hộp thư điện tử"),
    WORKING_HOURS("Giờ làm việc"),
    PORTAL("Cổng hỗ trợ trực tuyến");

    private final String displayName;
}
