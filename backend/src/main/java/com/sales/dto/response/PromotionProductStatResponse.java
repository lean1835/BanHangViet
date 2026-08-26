package com.sales.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PromotionProductStatResponse {
    private String productId;
    private String productName;
    private BigDecimal quantitySold;
    private BigDecimal revenue;
    private BigDecimal discountAmount;
}
