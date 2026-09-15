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
public class InventoryValuationReportResponse {
    private InventoryValuationSummaryResponse summary;
    private List<ProductGroupValuationResponse> groupValuations;
    private List<InventoryValuationItemResponse> items;
    private List<MissingCostProductResponse> missingCostItems;
}
