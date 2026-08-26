package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlowMovingProductListResponse {
    private SlowMovingSummaryResponse summary;
    private PageResponse<SlowMovingProductResponse> pageData;
}
