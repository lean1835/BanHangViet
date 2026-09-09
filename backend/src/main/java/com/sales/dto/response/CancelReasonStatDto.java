package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelReasonStatDto {
    private String reasonCode;
    private String reasonDescription;
    private long count;
    private double percentage;
}
