package com.sales.dto.response;

import com.sales.constant.CashTransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashTransactionCategoryResponse {
    private String id;
    private String name;
    private CashTransactionType type;
    private String description;
    private Boolean isActive;
    private Boolean isSystemDefault;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
