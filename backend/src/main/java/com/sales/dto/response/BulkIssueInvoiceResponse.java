package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkIssueInvoiceResponse {

    private String syncSessionCode;
    private int totalProcessed;
    private int successCount;
    private int failedCount;
    private List<InvoiceResponse> successInvoices;
    private List<BulkIssueFailedItemResponse> failedItems;
}
