package com.sales.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PosTransferItemResponse {

    private String id;
    private String productId;
    private String productSku;
    private String productName;
    private String unit;
    private BigDecimal quantity;
    private LocalDateTime createdAt;
}
