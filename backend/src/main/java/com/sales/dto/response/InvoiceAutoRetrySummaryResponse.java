package com.sales.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceAutoRetrySummaryResponse {

    private int totalProcessed;
    private int successCount;
    private int failedCount;
    private int movedToManualCount;
    private List<String> issuedInvoiceIds;
    private List<String> manualProcessingInvoiceIds;
}
