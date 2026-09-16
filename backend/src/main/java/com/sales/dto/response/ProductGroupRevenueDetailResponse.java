package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductGroupRevenueDetailResponse {

    private String groupId;
    private String groupName;

    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Builder.Default
    private List<ProductRevenueInGroupDto> items = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductRevenueInGroupDto {
        private String productId;
        private String productSku;
        private String productName;
        private String unit;

        @Builder.Default
        private BigDecimal quantitySold = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal revenue = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal percentageInGroup = BigDecimal.ZERO;
    }
}
