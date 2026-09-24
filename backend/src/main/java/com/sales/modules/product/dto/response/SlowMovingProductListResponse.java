package com.sales.modules.product.dto.response;
import com.sales.common.dto.PageResponse;

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
