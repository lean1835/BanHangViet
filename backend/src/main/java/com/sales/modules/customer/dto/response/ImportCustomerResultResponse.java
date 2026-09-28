package com.sales.modules.customer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportCustomerResultResponse {
    private int totalRows;
    private int successCount;
    private int updatedCount;
    private int skippedCount;
    private int errorCount;
    private List<RowErrorDetail> errors;
    private String errorFileBase64;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RowErrorDetail {
        private int rowNumber;
        private String customerName;
        private String phoneNumber;
        private String reason;
    }
}
