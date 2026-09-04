package com.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReturnTicketItemRequest {

    private String invoiceItemId;

    private String productId;

    private String productName;

    @NotNull(message = "Số lượng trả không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng trả phải lớn hơn 0")
    private BigDecimal quantity;
}
