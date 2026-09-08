package com.sales.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum BatchStatus {
    APPLIED("Đã áp dụng"),
    REVERTED("Đã hoàn tác");

    private final String description;
}
