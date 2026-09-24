package com.sales.modules.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportPreviewResponse {

    private int totalRows;
    private int validCount;
    private int duplicateCount;
    private int errorCount;
    private List<DuplicateDetail> duplicates;
    private List<RowErrorDetail> errors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DuplicateDetail {
        private int rowNumber;
        private String identifier; // phone or taxCode
        private String name;
        private String existingName;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RowErrorDetail {
        private int rowNumber;
        private String identifier;
        private String name;
        private String reason;
    }
}
