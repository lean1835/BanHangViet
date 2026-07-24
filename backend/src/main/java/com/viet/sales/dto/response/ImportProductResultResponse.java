package com.viet.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportProductResultResponse {

    private int totalRows;
    private int successCount;
    private int errorCount;
    private List<RowErrorDetail> errors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RowErrorDetail {
        private int rowNumber;
        private String productName;
        private String errorMessage;
    }
}
