package com.viet.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintSettingResponse {

    private String id;
    private String householdId;
    private String paperSize;
    private Integer printCopies;
    private Boolean autoPrint;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
