package com.sales.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogFilterRequest {

    private String username;
    private String action;
    private String targetTable;

    @DateTimeFormat(pattern = "yyyy-MM-dd['T'HH:mm:ss]")
    private LocalDateTime startDate;

    @DateTimeFormat(pattern = "yyyy-MM-dd['T'HH:mm:ss]")
    private LocalDateTime endDate;

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 20;
}
